// src/pages/Index.tsx
import { useCheckDebtExistence } from "@/hooks/useDebtData";
import { DebtSetup } from "@/components/DebtSetup";
import { DebtDashboard } from "@/components/DebtDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query"; // Importer pour refetch
import { LogoutButton } from '../auth/LogoutButton';
import { useAuth } from '../auth/AuthProvider';


const Index = () => {
  const queryClient = useQueryClient(); // Obtenir le client query
  // Le hook gère l'état isLoading, data (hasDebt), error, et refetch
  const { data: hasDebt, isLoading, error } = useCheckDebtExistence();

  // Fonction pour retenter le fetch
  const handleRetry = () => {
      queryClient.invalidateQueries({ queryKey: ['debt', 'exists'] }); // Invalider pour refetch
  };

  if (isLoading) {
    // Affichage Skeletons pendant la vérification initiale
    return (
       <div className="min-h-screen p-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-1/2 mb-4" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
           <Skeleton className="h-28 w-full rounded-lg md:col-span-3" /> {/* Projection */}
          <Skeleton className="h-20 w-full rounded-lg" /> {/* Progress */}
          <Skeleton className="h-80 w-full rounded-lg" /> {/* Balance Chart */}
          <Skeleton className="h-80 w-full rounded-lg" /> {/* Monthly Stats */}
          <Skeleton className="h-12 w-full rounded-lg" /> {/* Add Button */}
          <Skeleton className="h-60 w-full rounded-lg" /> {/* History */}
        </div>
      </div>
    );
  }

  if (error) {
    // Affichage en cas d'erreur
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-destructive mb-4">Erreur lors de la vérification initiale : {error.message}</p>
        <Button onClick={handleRetry}>Réessayer</Button> {/* Permet de retenter */}
      </div>
    );
  }

  const { session } = useAuth();

  // Si pas d'erreur et chargement terminé, on affiche conditionnellement
  // `hasDebt` sera `true` ou `false` ici
  return hasDebt ? <DebtDashboard /> : <DebtSetup />;
};

export default Index;