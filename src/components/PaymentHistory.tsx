// src/components/PaymentHistory.tsx
import { useState } from "react"; // Pour gérer l'ouverture de l'AlertDialog
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { supabase } from "@/integrations/supabase/client"; // Plus besoin ici
// import { toast } from "sonner"; // Géré dans le hook
import { Trash2, Calendar, FileText } from "lucide-react";
import { format, parseISO } from "date-fns"; // parseISO est utile si la date vient de Supabase comme string
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Payment, useDeletePaymentMutation } from "@/hooks/usePaymentsData"; // Importer le type et la mutation

// Interface mise à jour pour accepter debtId
interface PaymentHistoryProps {
  payments: Payment[];
  debtId: string | undefined; // Nécessaire pour l'invalidation de query
  // onPaymentDeleted: () => void; // Plus nécessaire, géré par l'invalidation
}

export const PaymentHistory = ({ payments, debtId }: PaymentHistoryProps) => {
  const deletePaymentMutation = useDeletePaymentMutation();
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null); // Pour savoir quel paiement supprimer

  const handleDeleteConfirm = () => {
    if (paymentToDelete) {
      deletePaymentMutation.mutate(
        { paymentId: paymentToDelete.id, debtId: debtId },
        {
          onSuccess: () => {
            setPaymentToDelete(null); // Réinitialiser après succès
          },
          // onError géré dans le hook
        }
      );
    }
  };

  if (payments.length === 0) {
    return (
      <Card className="p-12 shadow-soft text-center">
        <p className="text-muted-foreground">Aucun versement enregistré pour le moment.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      <h2 className="text-xl font-semibold">Historique des versements</h2>

      <AlertDialog
         open={!!paymentToDelete} // Contrôle l'ouverture
         onOpenChange={(open) => !open && setPaymentToDelete(null)} // Réinitialise si fermé
      >
        <div className="space-y-2">
          {payments.map((payment, index) => (
            <Card
              key={payment.id}
              className="p-4 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 50}ms`, opacity: deletePaymentMutation.isPending && deletePaymentMutation.variables?.paymentId === payment.id ? 0.5 : 1 }} // Opacité pendant suppression
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-2"> {/* Ajout marge droite */}
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-2xl font-semibold">
                      {/* Utilisation de Intl.NumberFormat pour le formatage */}
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(parseFloat(payment.amount.toString()))}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {/* Utiliser parseISO si payment_date est une string ISO */}
                        {format(parseISO(payment.payment_date), "dd MMMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>

                  {payment.note && (
                    <div className="flex items-start gap-1 mt-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground break-words">{payment.note}</p> {/* break-words */}
                    </div>
                  )}
                </div>

                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive flex-shrink-0" // flex-shrink-0
                    onClick={() => setPaymentToDelete(payment)} // Prépare la suppression
                    disabled={deletePaymentMutation.isPending} // Désactiver pendant une autre suppression
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
              </div>
            </Card>
          ))}
        </div>

        {/* Contenu de l'AlertDialog (déplacé hors de la boucle map) */}
        {paymentToDelete && (
             <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce versement ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le versement de{' '}
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(parseFloat(paymentToDelete.amount.toString()))}
                    {' '} du {format(parseISO(paymentToDelete.payment_date), "dd/MM/yyyy", { locale: fr })} sera supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setPaymentToDelete(null)} disabled={deletePaymentMutation.isPending}>
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    disabled={deletePaymentMutation.isPending} // Désactiver pendant la suppression
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletePaymentMutation.isPending ? "Suppression..." : "Supprimer"}
                  </AlertDialogAction>
                </AlertDialogFooter>
             </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
};