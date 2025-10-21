// src/pages/Index.tsx
import { useCheckDebtExistence } from "@/hooks/useDebtData";
import { DebtSetup } from "@/components/DebtSetup";
import { DebtDashboard } from "@/components/DebtDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // Pour le bouton réessayer

const Index = () => {
  // Utilise le hook pour vérifier l'existence de la dette
  const { data: hasDebt, isLoading, error, refetch } = useCheckDebtExistence();

  // Affichage Skeletons pendant la vérification initiale
  if (isLoading) {
    return (
       <div className="min-h-screen p-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse"> {/* Ajout animate-pulse */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-1/2 mb-4" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
          <Skeleton className="h-20 w-full rounded-lg" /> {/* Placeholder Progress */}
          <Skeleton className="h-80 w-full rounded-lg" /> {/* Placeholder Stats/Chart */}
          <Skeleton className="h-12 w-full rounded-lg" /> {/* Placeholder Button */}
          <Skeleton className="h-60 w-full rounded-lg" /> {/* Placeholder History */}
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur lors de la vérification
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-destructive mb-4">Erreur lors de la vérification de la dette : {error.message}</p>
        <Button onClick={() => refetch()}>Réessayer</Button>
      </div>
    );
  }

  // Si hasDebt est true (après chargement sans erreur), afficher le dashboard, sinon le setup
  // hasDebt peut être undefined si la requête n'a pas encore abouti, mais isLoading gère ce cas
  return hasDebt ? <DebtDashboard /> : <DebtSetup />;
};

export default Index;