// src/components/PaymentHistory.tsx
import { useState, useMemo } from "react"; // Ajout useMemo
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Importer Input
import {
  Select, // Importer Select et ses composants
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Calendar, FileText, Pencil, Search, ArrowUpDown } from "lucide-react"; // Ajout icônes
import { format, parseISO } from "date-fns";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Payment, useDeletePaymentMutation, useUpdatePaymentMutation } from "@/hooks/usePaymentsData";
import { PaymentForm } from "./PaymentForm";
import { formatCurrency } from "@/lib/utils"; // Importer formatCurrency

// Type pour les options de tri
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

interface PaymentHistoryProps {
  payments: Payment[];
  debtId: string | undefined;
}

export const PaymentHistory = ({ payments, debtId }: PaymentHistoryProps) => {
  const deletePaymentMutation = useDeletePaymentMutation();
  const updatePaymentMutation = useUpdatePaymentMutation();
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State pour le filtrage et le tri
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc'); // Tri par défaut

  // --- Logique de Filtrage et Tri ---
  const filteredAndSortedPayments = useMemo(() => {
    let filtered = payments;

    // Filtrage par note (insensible à la casse)
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.note?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return parseISO(a.payment_date).getTime() - parseISO(b.payment_date).getTime();
        case 'amount-desc':
          return parseFloat(b.amount.toString()) - parseFloat(a.amount.toString());
        case 'amount-asc':
          return parseFloat(a.amount.toString()) - parseFloat(b.amount.toString());
        case 'date-desc': // Cas par défaut
        default:
          return parseISO(b.payment_date).getTime() - parseISO(a.payment_date).getTime();
      }
    });

    return sorted;
  }, [payments, searchTerm, sortOption]); // Recalculer si les données, le filtre ou le tri changent

  // --- Handlers (inchangés) ---
  const handleDeleteConfirm = () => {
    if (paymentToDelete) {
      deletePaymentMutation.mutate(
        { paymentId: paymentToDelete.id, debtId: debtId },
        { onSuccess: () => setPaymentToDelete(null) }
      );
    }
  };
  const handleEditClick = (payment: Payment) => {
    setPaymentToEdit(payment);
    setIsEditModalOpen(true);
  };
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setPaymentToEdit(null);
  };
   const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setPaymentToEdit(null);
  };

  return (
    <div className="space-y-4 animate-fade-in-up"> {/* Augmenter l'espace */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-xl font-semibold whitespace-nowrap">Historique des versements</h2>

          {/* Controles de Filtre et Tri */}
          {payments.length > 0 && ( // Afficher les contrôles seulement s'il y a des paiements
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* Filtre par note */}
                <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Filtrer par note..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-9" // Ajuster padding et hauteur
                    />
                </div>

                {/* Sélecteur de Tri */}
                <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                         <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Trier par..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-desc">Date (plus récent)</SelectItem>
                        <SelectItem value="date-asc">Date (plus ancien)</SelectItem>
                        <SelectItem value="amount-desc">Montant (décroissant)</SelectItem>
                        <SelectItem value="amount-asc">Montant (croissant)</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          )}
      </div>


      {/* Affichage conditionnel : Liste ou Message si aucun résultat après filtrage */}
      {payments.length === 0 ? (
        <Card className="p-12 shadow-soft text-center">
          <p className="text-muted-foreground">Aucun versement enregistré pour le moment.</p>
        </Card>
      ) : filteredAndSortedPayments.length === 0 ? (
          <Card className="p-12 shadow-soft text-center">
            <p className="text-muted-foreground">Aucun versement ne correspond à votre filtre.</p>
          </Card>
      ) : (
        <>
          {/* AlertDialog pour la suppression */}
          <AlertDialog
            open={!!paymentToDelete}
            onOpenChange={(open) => !open && setPaymentToDelete(null)}
          >
              {/* AlertDialogContent reste ici */}
                {paymentToDelete && (
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce versement ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le versement de{' '}
                            {formatCurrency(parseFloat(paymentToDelete.amount.toString()))}
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

            {/* Liste des paiements filtrés et triés */}
            <div className="space-y-2">
              {filteredAndSortedPayments.map((payment, index) => (
                <Card
                  key={payment.id}
                  className="p-4 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-0.5"
                  // Animation: enlever l'ancien délai, ajouter une transition d'opacité
                  style={{ transition: 'opacity 0.3s ease-out', opacity: (deletePaymentMutation.isPending && deletePaymentMutation.variables?.paymentId === payment.id) || (updatePaymentMutation.isPending && updatePaymentMutation.variables?.paymentId === payment.id) ? 0.5 : 1 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-2">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-2xl font-semibold">
                          {formatCurrency(parseFloat(payment.amount.toString()))}
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

                    <div className="flex flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditClick(payment)}
                        disabled={deletePaymentMutation.isPending || updatePaymentMutation.isPending}
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="sr-only">Modifier</span>
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
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

          {/* Dialog pour l'édition */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
               {/* Ajouter un titre accessible au Dialog */}
                <DialogHeader>
                    <DialogTitle>{paymentToEdit ? "Modifier le versement" : "Détails"}</DialogTitle>
                     {/* Optionnel: Ajouter une DialogDescription si nécessaire */}
                </DialogHeader>
              <PaymentForm
                debtId={debtId!}
                paymentToEdit={paymentToEdit}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};