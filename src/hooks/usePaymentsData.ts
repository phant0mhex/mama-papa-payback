// src/hooks/usePaymentsData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayments, addPaymentRecord, deletePaymentRecord, updatePaymentRecord, type Payment, type NewPaymentData } from '@/services/supabaseService'; // Utilisez 'type' pour les imports de types
import { toast } from 'sonner';
import { DEBT_QUERY_KEY } from './useDebtData'; // Importer la clé de query de la dette

export const PAYMENTS_QUERY_KEY = 'payments'; // Clé unique pour les paiements
export type { Payment, NewPaymentData }; 

// Hook pour récupérer les paiements d'une dette
export function usePaymentsData(debtId: string | undefined) {
    return useQuery<Payment[], Error>({
        // La clé inclut debtId pour que le cache soit spécifique à cette dette
        queryKey: [PAYMENTS_QUERY_KEY, debtId],
        queryFn: () => {
            if (!debtId) return Promise.resolve([]); // Ne rien faire si pas d'ID
            return getPayments(debtId); // Appelle la fonction du service
        },
        enabled: !!debtId, // La query ne s'exécute que si debtId est fourni et non-vide
        staleTime: 1 * 60 * 1000, // Stale après 1 minute
        gcTime: 5 * 60 * 1000,   // Gardé 5 min après inactivité
        retry: 1,
        refetchOnWindowFocus: true, // Rafraîchit si on revient sur l'onglet
    });
}

// Hook pour la mutation d'ajout de paiement
export function useAddPaymentMutation() {
    const queryClient = useQueryClient();

    return useMutation<Payment, Error, { debtId: string; paymentData: NewPaymentData }>({
        mutationFn: addPaymentRecord, // Utilise la fonction du service
        onSuccess: (newPayment, variables) => {
            toast.success("Versement ajouté ! 👍");
            // Invalider les queries pour rafraîchir les données affectées
            // Invalide la liste des paiements pour cette dette spécifique
            queryClient.invalidateQueries({ queryKey: [PAYMENTS_QUERY_KEY, variables.debtId] });
            // Invalide aussi les données de la dette (pour recalculer total payé, etc.)
            queryClient.invalidateQueries({ queryKey: [DEBT_QUERY_KEY] });
        },
        onError: (error) => {
            console.error("Mutation Error: addPaymentRecord:", error);
            toast.error(`Erreur lors de l'ajout : ${error.message} 😥`);
        },
    });
}

// Hook pour la mutation de mise à jour de paiement
export function useUpdatePaymentMutation() {
    const queryClient = useQueryClient();

    return useMutation<Payment, Error, { paymentId: string; updatedData: PaymentFormValues; debtId: string | undefined }>({
        mutationFn: updatePaymentRecord, // Utilise la fonction du service
        onSuccess: (updatedPayment, variables) => {
            toast.success("Versement mis à jour ! ✨");
            // Invalider les queries pour rafraîchir les données affectées
            queryClient.invalidateQueries({ queryKey: [PAYMENTS_QUERY_KEY, variables.debtId] });
            queryClient.invalidateQueries({ queryKey: [DEBT_QUERY_KEY] });
            // Optionnel: Mise à jour optimiste du cache
            // queryClient.setQueryData([PAYMENTS_QUERY_KEY, variables.debtId], (oldData: Payment[] | undefined) =>
            //   oldData ? oldData.map(p => p.id === updatedPayment.id ? updatedPayment : p) : []
            // );
        },
        onError: (error) => {
            console.error("Mutation Error: updatePaymentRecord:", error);
            toast.error(`Erreur lors de la mise à jour : ${error.message} 😥`);
        },
    });
}

// Hook pour la mutation de suppression de paiement
export function useDeletePaymentMutation() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { paymentId: string; debtId: string | undefined }>({
        mutationFn: ({ paymentId }) => deletePaymentRecord(paymentId), // Appelle la fonction du service
        onSuccess: (_, variables) => {
            toast.success("Versement supprimé. 🗑️");
            // Invalider les queries pour rafraîchir les données affectées
            queryClient.invalidateQueries({ queryKey: [PAYMENTS_QUERY_KEY, variables.debtId] });
            queryClient.invalidateQueries({ queryKey: [DEBT_QUERY_KEY] });
        },
        onError: (error) => {
            console.error("Mutation Error: deletePaymentRecord:", error);
            toast.error(`Erreur lors de la suppression : ${error.message} 😥`);
        },
    });
}