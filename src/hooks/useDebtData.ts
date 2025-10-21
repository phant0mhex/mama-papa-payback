// src/hooks/useDebtData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDebt, addDebt, checkExistingDebt, Debt, NewDebtData } from '@/services/supabaseService';
import { toast } from 'sonner';

export const DEBT_QUERY_KEY = 'debt'; // Clé unique pour la dette

// Hook pour vérifier l'existence de la dette (utilisé dans Index.tsx)
export function useCheckDebtExistence() {
  return useQuery<boolean, Error>({
    queryKey: [DEBT_QUERY_KEY, 'exists'], // Clé spécifique pour cette requête
    queryFn: checkExistingDebt,
    staleTime: 5 * 60 * 1000, // Considéré à jour pendant 5 min
    gcTime: 10 * 60 * 1000,   // Gardé en cache pendant 10 min après inactivité
    retry: 1, // Réessayer 1 fois en cas d'échec
    refetchOnWindowFocus: false, // Optionnel: éviter le refetch au focus de la fenêtre
  });
}

// Hook pour récupérer les données de la dette (utilisé dans DebtDashboard)
export function useDebtData() {
    return useQuery<Debt | null, Error>({
        queryKey: [DEBT_QUERY_KEY], // Utilise la clé principale
        queryFn: getDebt,
        staleTime: 1 * 60 * 1000, // Moins long que l'existence, car peut changer avec les paiements
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: true, // Peut être utile si l'app est ouverte longtemps
    });
}

// Hook pour la mutation d'ajout de dette (utilisé dans DebtSetup)
export function useAddDebtMutation() {
    const queryClient = useQueryClient();

    return useMutation<Debt, Error, NewDebtData>({
        mutationFn: addDebt, // Utilise la fonction du service
        onSuccess: (newDebt) => {
            toast.success("Dette créée avec succès ! 🎉");
            // Met à jour directement le cache avec la nouvelle dette
            queryClient.setQueryData<Debt | null>([DEBT_QUERY_KEY], newDebt);
            // Invalide (et donc rafraîchit) la vérification d'existence
            // Cela provoquera le re-render de Index.tsx pour afficher le dashboard
            queryClient.invalidateQueries({ queryKey: [DEBT_QUERY_KEY, 'exists'] });
        },
        onError: (error) => {
            console.error("Mutation Error: addDebt:", error);
            toast.error(`Erreur lors de la création : ${error.message} 😥`);
        },
    });
}