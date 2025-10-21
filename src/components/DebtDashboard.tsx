// src/components/DebtDashboard.tsx
import { useState, useMemo } from "react"; // Ajout useMemo
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, TrendingDown, Wallet, CheckCircle2, Moon, Sun, Download } from "lucide-react";
import { PaymentForm } from "./PaymentForm";
import { PaymentHistory } from "./PaymentHistory";
import { MonthlyStats } from "./MonthlyStats";
import { exportToPDF } from "@/utils/pdfExport";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebtData } from "@/hooks/useDebtData"; // Hook pour la dette
import { usePaymentsData } from "@/hooks/usePaymentsData"; // Hook pour les paiements

// Types retirés car importés depuis les hooks/services

export const DebtDashboard = () => {
  // --- State & Data Fetching ---
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { theme, setTheme } = useTheme();

  // Utilisation des hooks React Query
  const { data: debt, isLoading: isDebtLoading, error: debtError } = useDebtData();
  // On passe debt?.id au hook des paiements, il ne fetchera que si l'ID existe
  const { data: payments = [], isLoading: isPaymentsLoading, error: paymentsError } = usePaymentsData(debt?.id);

  // Gérer l'état de chargement combiné
  const isLoading = isDebtLoading || (debt && isPaymentsLoading); // Charger les paiements seulement si la dette est chargée

  // --- Calculs Dérivés (avec useMemo pour optimiser) ---
  const { totalPaid, remaining, progressPercentage } = useMemo(() => {
    if (!debt) return { totalPaid: 0, remaining: 0, progressPercentage: 0 };

    const paid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);
    const remains = parseFloat(debt.total_amount.toString()) - paid;
    const progress = debt.total_amount > 0 ? (paid / parseFloat(debt.total_amount.toString())) * 100 : 0;

    return { totalPaid: paid, remaining: remains, progressPercentage: progress };
  }, [debt, payments]); // Recalculer seulement si debt ou payments change

  // --- Gestion des Erreurs ---
   if (debtError || paymentsError) {
       const error = debtError || paymentsError; // Prend la première erreur
       return (
           <div className="min-h-screen flex items-center justify-center p-6 text-center text-destructive">
               Erreur lors du chargement des données: {error?.message || 'Erreur inconnue'}
           </div>
       );
   }

  // --- Affichage Pendant le Chargement ---
  if (isLoading) {
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
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
      </div>
     );
  }

  // --- Cas où la Dette n'est pas trouvée (après chargement) ---
  // Normalement géré par Index.tsx qui affiche DebtSetup si pas de dette
  // Mais ajoutons une sécurité ici.
  if (!debt) {
     return (
       <div className="min-h-screen flex items-center justify-center p-6 text-center">
         <p className="text-muted-foreground">Aucune dette n'a été configurée.</p>
         {/* Optionnel: Bouton pour rediriger vers le setup si nécessaire */}
       </div>
     );
  }

  // --- Handler Export PDF ---
  const handleExportPDF = () => {
    // La vérification !debt est faite implicitement car on n'atteint ce code que si debt existe
    try {
      // Trier les paiements par date (du plus ancien au plus récent) pour le PDF
      const sortedPayments = [...payments].sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());
      exportToPDF(debt, sortedPayments, totalPaid, remaining);
      toast.success("PDF exporté avec succès 📄");
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'} 😥`);
    }
  };

  // --- Rendu Normal ---
  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Suivi de remboursement</h1>
            {debt.description && (
              <p className="text-muted-foreground mt-1">{debt.description}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Changer de thème</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Dette totale</p>
                <p className="text-3xl font-semibold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(debt.total_amount)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Déjà remboursé</p>
                <p className="text-3xl font-semibold text-success">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalPaid)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center animate-scale-in">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reste à payer</p>
                <p className="text-3xl font-semibold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(remaining)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 shadow-soft animate-fade-in overflow-hidden">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Progression</p>
              <p className="text-sm font-semibold text-success">{progressPercentage.toFixed(1)}%</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative cursor-default">
                  <Progress value={progressPercentage} className="h-3 animate-progress-fill transition-all duration-1000" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalPaid)} /{' '}
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(debt.total_amount)}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Monthly Stats */}
        <MonthlyStats payments={payments} onExportPDF={handleExportPDF} />

        {/* Add Payment Button */}
        {!showPaymentForm && (
          <Button
            onClick={() => setShowPaymentForm(true)}
            className="w-full"
            size="lg"
            // Désactiver si un paiement est en cours d'ajout/suppression? Optionnel.
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un versement
          </Button>
        )}

        {/* Payment Form */}
        {showPaymentForm && (
          <PaymentForm
            debtId={debt.id}
            onSuccess={() => {
              setShowPaymentForm(false); // Fermer le formulaire après succès (géré dans le hook)
            }}
            onCancel={() => setShowPaymentForm(false)}
          />
        )}

        {/* Payment History */}
        <PaymentHistory
          payments={payments}
          debtId={debt.id} // Passer debtId pour la mutation delete
          // onPaymentDeleted n'est plus nécessaire
        />
      </div>
    </div>
  );
};