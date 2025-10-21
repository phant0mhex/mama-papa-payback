// src/services/supabaseService.ts
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { DebtSetupValues } from "@/lib/schemas"; // Assurez-vous d'avoir ce fichier
import { format } from "date-fns";
import { type PaymentFormValues } from "@/lib/schemas";
export type Debt = Database['public']['Tables']['debt']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type NewPaymentData = Omit<Database['public']['Tables']['payments']['Insert'], 'id' | 'created_at' | 'debt_id'> & { payment_date: Date }; // Utilise Date pour le hook
export type NewDebtData = Database['public']['Tables']['debt']['Insert'];
export type UpdatePaymentData = Partial<Pick<Payment, 'amount' | 'payment_date' | 'note'>>;
// --- Debt ---

// Fonction pour vérifier s'il existe une dette
export const checkExistingDebt = async (): Promise<boolean> => {
  const { data, error, count } = await supabase
    .from("debt")
    .select("id", { count: 'exact', head: true }) // Plus efficace pour juste vérifier l'existence
    .limit(1);

  if (error && error.code !== "PGRST116") { // PGRST116 = Pas de lignes trouvées, ce qui est ok ici
    console.error("Error checking for debt:", error);
    throw new Error(`Erreur lors de la vérification de la dette: ${error.message}`);
  }
  return !!data || (count !== null && count > 0);
};

// Fonction pour récupérer LA dette (on assume une seule dette pour l'instant)
export const getDebt = async (): Promise<Debt | null> => {
    const { data, error } = await supabase
      .from("debt")
      .select("*")
      .order("created_at", { ascending: false }) // Prend la plus récente si jamais il y en avait plusieurs
      .limit(1)
      .maybeSingle(); // Retourne null si aucune dette trouvée, sans erreur

    if (error) {
        console.error("Error fetching debt:", error);
        throw new Error(`Erreur de récupération de la dette: ${error.message}`);
    }
    return data;
};

// Fonction pour créer la dette initiale
export const addDebt = async (debtData: NewDebtData): Promise<Debt> => {
    const { data, error } = await supabase
        .from("debt")
        .insert(debtData)
        .select() // Retourne la ligne insérée
        .single(); // S'attend à une seule ligne

    if (error) {
        console.error("Error creating debt:", error);
        throw new Error(`Erreur lors de la création de la dette: ${error.message}`);
    }
     if (!data) {
        throw new Error("Aucune donnée retournée après la création de la dette.");
    }
    return data;
};

// --- Payments ---

// Fonction pour récupérer les paiements d'une dette spécifique
export const getPayments = async (debtId: string): Promise<Payment[]> => {
    if (!debtId) return []; // Retourne un tableau vide si debtId n'est pas fourni

    const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("debt_id", debtId)
        .order("payment_date", { ascending: false });

    if (error) {
        console.error("Error fetching payments:", error);
        throw new Error(`Erreur de récupération des paiements: ${error.message}`);
    }
    return data || [];
};

// Fonction pour ajouter un paiement
export const addPaymentRecord = async ({ debtId, paymentData }: { debtId: string, paymentData: NewPaymentData }): Promise<Payment> => {
    const { data, error } = await supabase
        .from("payments")
        .insert({
            debt_id: debtId,
            amount: paymentData.amount,
            payment_date: format(paymentData.payment_date, "yyyy-MM-dd"), // Formatage pour Supabase
            note: paymentData.note || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error adding payment:", error);
        throw new Error(`Erreur lors de l'ajout du paiement: ${error.message}`);
    }
     if (!data) {
        throw new Error("Aucune donnée retournée après l'ajout du paiement.");
    }
    return data;
};

// Fonction pour mettre à jour un paiement
export const updatePaymentRecord = async ({ paymentId, updatedData }: { paymentId: string, updatedData: PaymentFormValues }): Promise<Payment> => {
  console.log("Service: updatePaymentRecord called for paymentId:", paymentId, "with data:", updatedData);
  const formattedDate = format(updatedData.payment_date, "yyyy-MM-dd"); // Formatage ici

  const { data, error } = await supabase
    .from("payments")
    .update({
      amount: updatedData.amount,
      payment_date: formattedDate,
      note: updatedData.note || null,
      // Ne met pas à jour debt_id ou created_at
    })
    .eq("id", paymentId)
    .select()
    .single();

  if (error) {
    console.error("Service Error: updatePaymentRecord:", error);
    throw new Error(`Erreur lors de la mise à jour du paiement: ${error.message}`);
  }
  if (!data) {
    throw new Error("Aucune donnée retournée après la mise à jour du paiement.");
  }
  console.log("Service: updatePaymentRecord result:", data);
  return data;
};

// Fonction pour supprimer un paiement
export const deletePaymentRecord = async (paymentId: string): Promise<void> => {
    const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

    if (error) {
        console.error("Error deleting payment:", error);
        throw new Error(`Erreur lors de la suppression du paiement: ${error.message}`);
    }
    // Pas de retour nécessaire si succès
};