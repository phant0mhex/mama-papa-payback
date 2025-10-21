// src/components/PaymentHistory.tsx
import { useState } from "react"; // Pour gérer l'ouverture de l'AlertDialog
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { supabase } from "@/integrations/supabase/client"; // Plus besoin ici
// import { toast } from "sonner"; // Géré dans le hook
import { Trash2, Calendar, FileText, Pencil } from "lucide-react";
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

import {
  Dialog, // Utiliser Dialog pour l'édition
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Payment, useDeletePaymentMutation, useUpdatePaymentMutation } from "@/hooks/usePaymentsData"; // Importer le type et la mutation
import { PaymentForm } from "./PaymentForm"; // Importer le formulaire

// Interface mise à jour pour accepter debtId
interface PaymentHistoryProps {
  payments: Payment[];
  debtId: string | undefined; // Nécessaire pour l'invalidation de query
  // onPaymentDeleted: () => void; // Plus nécessaire, géré par l'invalidation
}

export const PaymentHistory = ({ payments, debtId }: PaymentHistoryProps) => {
  const deletePaymentMutation = useDeletePaymentMutation();
  const updatePaymentMutation = useUpdatePaymentMutation();
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null); // Pour savoir quel paiement supprimer
const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null); // State pour l'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State pour contrôler l'ouverture/fermeture du Dialog

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

const handleEditClick = (payment: Payment) => {
    setPaymentToEdit(payment);
    setIsEditModalOpen(true); // Ouvre le Dialog d'édition
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false); // Ferme le Dialog après succès
    setPaymentToEdit(null); // Réinitialise l'état d'édition
  };

   const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setPaymentToEdit(null);
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

      {/* AlertDialog pour la suppression */}
      <AlertDialog
         open={!!paymentToDelete}
         onOpenChange={(open) => !open && setPaymentToDelete(null)}
      >
        {/* ... (AlertDialogContent reste le même) ... */}
         {paymentToDelete && (
             <AlertDialogContent>
                {/* ... Header, Description, Footer ... */}
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
                    disabled={deletePaymentMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletePaymentMutation.isPending ? "Suppression..." : "Supprimer"}
                  </AlertDialogAction>
                </AlertDialogFooter>
             </AlertDialogContent>
        )}

        {/* Liste des paiements */}
        <div className="space-y-2">
          {payments.map((payment, index) => (
            <Card
              key={payment.id}
              className="p-4 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 50}ms`, opacity: (deletePaymentMutation.isPending && deletePaymentMutation.variables?.paymentId === payment.id) ? 0.5 : 1 }}
            >
              <div className="flex items-start justify-between">
                {/* ... (Affichage Montant, Date, Note) ... */}
                 <div className="flex-1 mr-2">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-2xl font-semibold">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(parseFloat(payment.amount.toString()))}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(parseISO(payment.payment_date), "dd MMMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                  {payment.note && (
                    <div className="flex items-start gap-1 mt-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground break-words">{payment.note}</p>
                    </div>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-shrink-0">
                  {/* Bouton Modifier */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleEditClick(payment)}
                    disabled={deletePaymentMutation.isPending || updatePaymentMutation.isPending} // Désactiver pendant les mutations
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="sr-only">Modifier</span>
                  </Button>

                  {/* Bouton Supprimer (déclenche AlertDialog) */}
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPaymentToDelete(payment)}
                      disabled={deletePaymentMutation.isPending || updatePaymentMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                  </AlertDialogTrigger>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </AlertDialog>

       {/* Dialog pour l'édition (placé hors de la boucle) */}
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
         <DialogContent className="sm:max-w-[425px]">
           {/* Le composant PaymentForm est rendu à l'intérieur du Dialog */}
           {/* On passe le paymentToEdit et les callbacks */}
           <PaymentForm
             debtId={debtId!} // debtId est forcément défini si on est ici
             paymentToEdit={paymentToEdit}
             onSuccess={handleEditSuccess}
             onCancel={handleEditCancel}
           />
         </DialogContent>
       </Dialog>

    </div>
  );
};

// Ajouter useUpdatePaymentMutation pour vérifier isPending dans le JSX
// Il faut l'importer et l'instancier en haut du composant :
// const updatePaymentMutation = useUpdatePaymentMutation();
// (Ceci a été fait dans l'exemple ci-dessus)