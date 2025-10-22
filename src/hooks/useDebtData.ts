// src/hooks/useDebtData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getDebt,
    addDebt,
    updateDebt,
    checkExistingDebt,
    type Debt,
    type NewDebtData, // Utilise le type Zod DebtSetupValues via l'alias
    type UpdateDebtData // Utilise le type Zod DebtSetupValues via l'alias
} from '@/services/supabaseService';
import { toast } from 'sonner';

export const DEBT_QUERY_KEY = 'debt';
// Exporter seulement les types nécessaires publiquement
export type { Debt };

// Hook pour vérifier l'existence de la dette
export function useCheckDebtExistence() {
  return useQuery<boolean, Error>({
    queryKey: [DEBT_QUERY_KEY, 'exists'],
    queryFn: checkExistingDebt,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// Hook pour récupérer les données de la dette
export function useDebtData() {
    return useQuery<Debt | null, Error>({
        queryKey: [DEBT_QUERY_KEY],
        queryFn: getDebt,
        staleTime: 1 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: true,
    });
}

// Hook pour la mutation d'ajout de dette
export function useAddDebtMutation() {
    const queryClient = useQueryClient();

    return useMutation<Debt, Error, NewDebtData>({
        mutationFn: addDebt,
        onSuccess: (newDebt) => {
            toast.success("Dette créée avec succès ! 🎉");
            queryClient.setQueryData<Debt | null>([DEBT_QUERY_KEY], newDebt);
            queryClient.invalidateQueries({ queryKey: [DEBT_QUERY_KEY, 'exists'] });
        },
        onError: (error) => {
            console.error("Mutation Error: addDebt:", error);
            toast.error(`Erreur lors de la création : ${error.message} 😥`);
        },
    });
}

// Hook pour la mutation de mise à jour de la dette
export function useUpdateDebtMutation() {
    const queryClient = useQueryClient();

    return useMutation<Debt, Error, { debtId: string; updatedData: UpdateDebtData }>({
        mutationFn: updateDebt,
        onSuccess: (updatedDebt, variables) => {
            toast.success("Dette mise à jour ! ✨");
            // Mettre à jour le cache directement avec les nouvelles données
            queryClient.setQueryData<Debt | null>([DEBT_QUERY_KEY], updatedDebt);
             // On peut aussi invalider pour être sûr, même si setQueryData suffit souvent
             // queryClient.invalidateQueries({ queryKey: [DEBT_QUERY_KEY] });

            // Invalider aussi les paiements si le total a changé, car cela affecte 'remaining'
            // Ceci assure que DebtDashboard recalcule avec les bonnes données.
            // queryClient.invalidateQueries({ queryKey: ['payments', variables.debtId] }); // Utiliser PAYMENTS_QUERY_KEY
        },
        onError: (error) => {
            console.error("Mutation Error: updateDebt:", error);
            toast.error(`Erreur lors de la mise à jour : ${error.message} 😥`);
        },
    });
}