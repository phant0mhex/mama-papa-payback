// src/services/supabaseService.ts
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { type PaymentFormValues, type DebtSetupValues } from "@/lib/schemas";

// Types exportés pour être utilisés dans les hooks et composants
export type Debt = Database['public']['Tables']['debt']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
// Utilise le type Zod pour addDebt et updateDebt pour la cohérence de validation
export type NewDebtData = DebtSetupValues;
export type UpdateDebtData = DebtSetupValues;
// Type spécifique pour les données brutes d'un nouveau paiement avant formatage date
export type NewPaymentInput = PaymentFormValues;


// --- Debt ---

// Fonction pour vérifier s'il existe une dette
export const checkExistingDebt = async (): Promise<boolean> => {
  console.log("Service: checkExistingDebt called");
  const { error, count } = await supabase
    .from("debt")
    .select("id", { count: 'exact', head: true })
    .limit(0);

  if (error && error.code !== "PGRST116") {
    console.error("Service Error: checkExistingDebt:", error);
    throw new Error(`Erreur lors de la vérification de la dette: ${error.message}`);
  }
  console.log("Service: checkExistingDebt result:", count);
  return (count !== null && count > 0);
};

// Fonction pour récupérer LA dette (la plus récente)
export const getDebt = async (): Promise<Debt | null> => {
  console.log("Service: getDebt called");
  const { data, error } = await supabase
    .from("debt")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Service Error: getDebt:", error);
    throw new Error(`Erreur de récupération de la dette: ${error.message}`);
  }
  console.log("Service: getDebt result:", data);
  return data;
};

// Fonction pour créer la dette initiale
export const addDebt = async (debtData: NewDebtData): Promise<Debt> => {
  console.log("Service: addDebt called with:", debtData);
  const { data, error } = await supabase
    .from("debt")
    .insert({
      total_amount: debtData.total_amount,
      description: debtData.description || null, // Assure null si vide
    })
    .select()
    .single();

  if (error) {
    console.error("Service Error: addDebt:", error);
    throw new Error(`Erreur lors de la création de la dette: ${error.message}`);
  }
  if (!data) {
    throw new Error("Aucune donnée retournée après la création de la dette.");
  }
  console.log("Service: addDebt result:", data);
  return data;
};

// Fonction pour mettre à jour la dette
export const updateDebt = async ({ debtId, updatedData }: { debtId: string, updatedData: UpdateDebtData }): Promise<Debt> => {
    console.log("Service: updateDebt called for debtId:", debtId, "with data:", updatedData);
    const { data, error } = await supabase
        .from("debt")
        .update({
            total_amount: updatedData.total_amount,
            description: updatedData.description || null, // Assure null si vide
        })
        .eq("id", debtId)
        .select()
        .single();

    if (error) {
        console.error("Service Error: updateDebt:", error);
        throw new Error(`Erreur lors de la mise à jour de la dette: ${error.message}`);
    }
    if (!data) {
        throw new Error("Aucune donnée retournée après la mise à jour de la dette.");
    }
    console.log("Service: updateDebt result:", data);
    return data;
};

// --- Payments ---

// Fonction pour récupérer les paiements d'une dette spécifique
export const getPayments = async (debtId: string): Promise<Payment[]> => {
  console.log("Service: getPayments called for debtId:", debtId);
  if (!debtId) {
    console.log("Service: getPayments skipped, no debtId");
    return [];
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("debt_id", debtId)
    // Tri par défaut (peut être surchargé ou fait côté client si nécessaire)
    .order("payment_date", { ascending: false });

  if (error) {
    console.error("Service Error: getPayments:", error);
    throw new Error(`Erreur de récupération des paiements: ${error.message}`);
  }
  console.log("Service: getPayments result count:", data?.length ?? 0);
  return data || [];
};

// Fonction pour ajouter un paiement
export const addPaymentRecord = async ({ debtId, paymentData }: { debtId: string, paymentData: NewPaymentInput }): Promise<Payment> => {
  console.log("Service: addPaymentRecord called for debtId:", debtId, "with data:", paymentData);
  const formattedDate = format(paymentData.payment_date, "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("payments")
    .insert({
      debt_id: debtId,
      amount: paymentData.amount,
      payment_date: formattedDate,
      note: paymentData.note || null, // Assure null si vide
    })
    .select()
    .single();

  if (error) {
    console.error("Service Error: addPaymentRecord:", error);
    throw new Error(`Erreur lors de l'ajout du paiement: ${error.message}`);
  }
  if (!data) {
    throw new Error("Aucune donnée retournée après l'ajout du paiement.");
  }
  console.log("Service: addPaymentRecord result:", data);
  return data;
};

// Fonction pour mettre à jour un paiement
export const updatePaymentRecord = async ({ paymentId, updatedData }: { paymentId: string, updatedData: PaymentFormValues }): Promise<Payment> => {
  console.log("Service: updatePaymentRecord called for paymentId:", paymentId, "with data:", updatedData);
  const formattedDate = format(updatedData.payment_date, "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("payments")
    .update({
      amount: updatedData.amount,
      payment_date: formattedDate,
      note: updatedData.note || null, // Assure null si vide
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
  console.log("Service: deletePaymentRecord called for paymentId:", paymentId);
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId);

  if (error) {
    console.error("Service Error: deletePaymentRecord:", error);
    throw new Error(`Erreur lors de la suppression du paiement: ${error.message}`);
  }
  console.log("Service: deletePaymentRecord successful for:", paymentId);
};