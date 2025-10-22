// src/hooks/usePaymentsData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPayments,
    addPaymentRecord,
    deletePaymentRecord,
    updatePaymentRecord,
    type Payment,
    type NewPaymentInput // Utilise le type Zod PaymentFormValues via l'alias
} from '@/services/supabaseService';
import { toast } from 'sonner';
import { DEBT_QUERY_KEY } from './useDebtData';
import { type PaymentFormValues } from '@/lib/schemas'; // Importer juste pour la mutation update

export const PAYMENTS_QUERY_KEY = 'payments';
// Ré-exporter les types nécessaires pour les composants
export type { Payment, NewPaymentInput };

// Hook pour récupérer les paiements d'une dette
export function usePaymentsData(debtId: string | undefined) {
    return useQuery<Payment[], Error>({
        queryKey: [PAYMENTS_QUERY_KEY, debtId],
        queryFn: () => {
            if (!debtId) return Promise.resolve([]);
            return getPayments(debtId);
        },
        enabled: !!debtId,
        staleTime: 1 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: true,
    });
}

// Hook pour la mutation d'ajout de paiement
export function useAddPaymentMutation() {
    const queryClient = useQueryClient();

    // Le type ici attend { debtId: string; paymentData: NewPaymentInput }
    return useMutation<Payment, Error, { debtId: string; paymentData: NewPaymentInput }>({
        mutationFn: addPaymentRecord,
        onSuccess: (newPayment, variables) => {
            toast.success("Versement ajouté ! 👍");
            // Invalider force React Query à re-fetcher les données fraîches
            queryClient.invalidateQueries({ queryKey: [PAYMENTS_QUERY_KEY, variables.debtId] });
            queryClient.invalidateQueries({ queryKey: [DEBT_QUERY_KEY] }); // Pour recalculer totaux, etc.
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

    // Le type ici attend { paymentId: string; updatedData: PaymentFormValues; debtId: string | undefined }
    return useMutation<Payment, Error, { paymentId: string; updatedData: PaymentFormValues; debtId: string | undefined }>({
        mutationFn: updatePaymentRecord,
        onSuccess: (updatedPayment, variables) => {
            toast.success("Versement mis à jour ! ✨");
            queryClient.invalidateQueries({ queryKey: [PAYMENTS_QUERY_KEY, variables.debtId] });
            queryClient.invalidateQueries({ queryKey: [DEBT_QUERY_KEY] });
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
        mutationFn: ({ paymentId }) => deletePaymentRecord(paymentId),
        onSuccess: (_, variables) => {
            toast.success("Versement supprimé. 🗑️");
            queryClient.invalidateQueries({ queryKey: [PAYMENTS_QUERY_KEY, variables.debtId] });
            queryClient.invalidateQueries({ queryKey: [DEBT_QUERY_KEY] });
        },
        onError: (error) => {
            console.error("Mutation Error: deletePaymentRecord:", error);
            toast.error(`Erreur lors de la suppression : ${error.message} 😥`);
        },
    });
}