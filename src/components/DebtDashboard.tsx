// src/components/DebtDashboard.tsx
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, TrendingDown, Wallet, CheckCircle2, Moon, Sun, Download, Clock, Pencil } from "lucide-react";
import { PaymentForm } from "./PaymentForm";
import { PaymentHistory } from "./PaymentHistory";
import { MonthlyStats } from "./MonthlyStats";
import { BalanceChart } from "./BalanceChart"; // Assurez-vous que ce composant existe
import { exportToPDF } from "@/utils/pdfExport"; // Assurez-vous que ce fichier existe et est à jour
import { useTheme } from "next-themes";
import { LogoutButton } from '../auth/LogoutButton';
import { useAuth } from '../auth/AuthProvider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { DebtEditForm } from "./DebtEditForm"; // Assurez-vous que ce composant existe
import { useDebtData } from "@/hooks/useDebtData"; // Hook pour la dette
import { usePaymentsData } from "@/hooks/usePaymentsData"; // Hook pour les paiements
import { formatCurrency } from "@/lib/utils"; // Fonction de formatage
import { addMonths, format, parseISO, differenceInMonths, startOfMonth, isValid } from "date-fns"; // Ajout isValid
import { fr } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query"; // Pour refetch manuel si besoin




export const DebtDashboard = () => {
  // --- State & Data Fetching ---
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditDebtForm, setShowEditDebtForm] = useState(false);
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient(); // Client Query pour invalidation/refetch manuel si besoin

  // Utilisation des hooks React Query
  const { data: debt, isLoading: isDebtLoading, error: debtError, refetch: refetchDebt } = useDebtData();
  // On passe debt?.id au hook des paiements, il ne fetchera que si l'ID existe
  const { data: payments = [], isLoading: isPaymentsLoading, error: paymentsError, refetch: refetchPayments } = usePaymentsData(debt?.id);

  // Gérer l'état de chargement combiné
  // On charge les paiements seulement si la dette est chargée (ou en cours de chargement)
  const isLoading = isDebtLoading || (debt !== undefined && !debtError && isPaymentsLoading); // Afficher chargement si dette ok mais paiements en cours

  // --- Calculs Dérivés (avec useMemo pour optimiser) ---
  const { totalPaid, remaining, progressPercentage, projectedPayoffDate, averageMonthlyPayment } = useMemo(() => {
    // Si la dette n'est pas encore chargée ou n'existe pas, retourner des valeurs par défaut
    if (!debt) return { totalPaid: 0, remaining: 0, progressPercentage: 0, projectedPayoffDate: null, averageMonthlyPayment: 0 };

    const debtTotalAmount = parseFloat(debt.total_amount.toString());
    // S'assurer que payments est un tableau avant de réduire
    const validPayments = Array.isArray(payments) ? payments : [];
    const paid = validPayments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);
    const remains = debtTotalAmount - paid;
    const progress = debtTotalAmount > 0 ? (paid / debtTotalAmount) * 100 : 0;

    // Calcul pour la projection
    let projectedDate: string | null = null;
    let avgPayment = 0;

    if (validPayments.length > 0 && remains > 0) {
      // Trier les paiements par date pour le calcul de la moyenne
      const sortedPayments = [...validPayments].sort((a, b) => {
          try { return parseISO(a.payment_date).getTime() - parseISO(b.payment_date).getTime(); }
          catch { return 0; } // Gère dates invalides au tri
      });

      let firstPaymentDate : Date | null = null;
      try { firstPaymentDate = parseISO(sortedPayments[0].payment_date); } catch {}

      if(firstPaymentDate && isValid(firstPaymentDate)) {
          const now = new Date();
          // Nombre de mois écoulés depuis le début du mois du premier paiement (au moins 1 mois complet)
          const monthsElapsed = Math.max(1, differenceInMonths(now, startOfMonth(firstPaymentDate)) + 1);
          avgPayment = paid / monthsElapsed; // Moyenne sur toute la période depuis le premier paiement

          if (avgPayment > 0) {
            const monthsRemaining = Math.ceil(remains / avgPayment);
            // S'assurer que monthsRemaining n'est pas infini ou trop grand
            if (isFinite(monthsRemaining) && monthsRemaining < 1200) { // Limite arbitraire (100 ans)
                const payoffDate = addMonths(now, monthsRemaining);
                projectedDate = format(payoffDate, "MMMM yyyy", { locale: fr });
            } else {
                 projectedDate = "Très lointain..."; // Cas où la moyenne est très faible
            }
          }
      }
    }

    return {
        totalPaid: paid,
        remaining: remains,
        progressPercentage: progress,
        projectedPayoffDate: projectedDate,
        averageMonthlyPayment: avgPayment
    };
  }, [debt, payments]); // Recalculer seulement si debt ou payments change

  // --- Gestion des Erreurs ---
   if (debtError || paymentsError) {
       const error = debtError || paymentsError; // Prend la première erreur
       const handleRetry = () => {
           // Invalider les requêtes échouées pour retenter
           if (debtError) queryClient.invalidateQueries({ queryKey: [useDebtData.DEBT_QUERY_KEY] });
           if (paymentsError) queryClient.invalidateQueries({ queryKey: [usePaymentsData.PAYMENTS_QUERY_KEY, debt?.id]});
           // Alternative plus simple : refetch direct
           // if (debtError) refetchDebt();
           // if (paymentsError) refetchPayments();
       };
       return (
           <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
               <p className="text-destructive mb-4">Erreur lors du chargement des données: {error?.message || 'Erreur inconnue'}</p>
               <Button onClick={handleRetry}>Réessayer</Button>
           </div>
       );
   }

  // --- Affichage Pendant le Chargement ---
  if (isLoading) {
     return (
       <div className="min-h-screen p-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-3/5 mb-4 rounded-md" /> {/* Ajusté w-3/5 */}
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
           {/* Projection Card Skeleton */}
           <Skeleton className="h-28 w-full rounded-lg md:col-span-3" />
          {/* Progress Skeleton */}
          <Skeleton className="h-20 w-full rounded-lg p-6 space-y-3">
              <div className="flex justify-between items-center">
                 <Skeleton className="h-4 w-1/4 rounded-md"/>
                 <Skeleton className="h-4 w-1/6 rounded-md"/>
              </div>
              <Skeleton className="h-3 w-full rounded-full"/>
          </Skeleton>
          {/* Balance Chart Skeleton */}
          <Skeleton className="h-80 w-full rounded-lg" />
          {/* Monthly Stats Skeleton */}
          <Skeleton className="h-80 w-full rounded-lg" />
          {/* Add Button Skeleton */}
          <Skeleton className="h-12 w-full rounded-lg" />
          {/* History Skeleton */}
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
      </div>
     );
  }

  // --- Cas où la Dette n'existe pas (après chargement sans erreur) ---
  // Devrait être géré par Index.tsx, mais sécurité supplémentaire.
  if (!debt) {
     return (
       <div className="min-h-screen flex items-center justify-center p-6 text-center">
         <p className="text-muted-foreground">Aucune dette n'a été configurée.</p>
         {/* Peut-être un lien pour retourner à la configuration ? */}
       </div>
     );
  }

  // --- Handler Export PDF ---
  const handleExportPDF = () => {
    try {
      // Trier les paiements par date (du plus ancien au plus récent) pour le PDF
      const sortedPayments = [...payments].sort((a, b) => {
          try { return parseISO(a.payment_date).getTime() - parseISO(b.payment_date).getTime(); }
          catch { return 0; }
      });
      exportToPDF(debt, sortedPayments, totalPaid, remaining);
      toast.success("PDF exporté avec succès 📄");
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'} 😥`);
    }
  };


  const { session } = useAuth();

  
  // --- Rendu Normal ---
  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header avec bouton Modifier Dette */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold flex items-center gap-2 flex-wrap"> {/* Ajout flex-wrap */}
                <span>Suivi de remboursement</span>
                {/* Bouton Modifier Dette (ouvre le Dialog) */}
                <Dialog open={showEditDebtForm} onOpenChange={setShowEditDebtForm}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <Pencil className="w-4 h-4" />
                            <span className="sr-only">Modifier la dette</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Modifier la dette</DialogTitle>
                            <DialogDescription>Modifiez le montant total ou la description.</DialogDescription>
                        </DialogHeader>
                        {/* Le formulaire d'édition est rendu ici */}
                        <DebtEditForm
                            debt={debt} // debt est garanti non-null ici
                            onSuccess={() => setShowEditDebtForm(false)} // Ferme le dialog
                            onCancel={() => setShowEditDebtForm(false)} // Ferme le dialog
                        />
                    </DialogContent>
                </Dialog>
            </h1>
            {debt.description && (
              <p className="text-muted-foreground mt-1 break-words">{debt.description}</p> // Ajout break-words
            )}
          </div>
          {/* Bouton Thème */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="flex-shrink-0" // Empêche le bouton de réduire
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Changer de thème</span>
          </Button>

          <LogoutButton />


        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
             <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground mb-1">Dette totale</p><p className="text-3xl font-semibold">{formatCurrency(debt.total_amount)}</p></div><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="w-6 h-6 text-primary" /></div></div>
            </Card>
            <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground mb-1">Déjà remboursé</p><p className="text-3xl font-semibold text-success">{formatCurrency(totalPaid)}</p></div><div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center animate-scale-in"><CheckCircle2 className="w-6 h-6 text-success" /></div></div>
            </Card>
            <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground mb-1">Reste à payer</p><p className="text-3xl font-semibold">{formatCurrency(remaining)}</p></div><div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center"><TrendingDown className="w-6 h-6 text-accent" /></div></div>
            </Card>
        </div>

        {/* Carte Projection */}
         <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1 animate-fade-in">
             <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">Projection de fin</p>
                    <p className="text-3xl font-semibold">
                        {remaining <= 0 ? "🎉 Terminé !" : (projectedPayoffDate || "N/A")}
                    </p>
                    {remaining <= 0 ? (
                         <p className="text-sm text-muted-foreground mt-1">
                           Félicitations !
                         </p>
                    ) : averageMonthlyPayment > 0 && projectedPayoffDate ? (
                         <p className="text-sm text-muted-foreground mt-1">
                            Basé sur une moyenne de {formatCurrency(averageMonthlyPayment)} / mois
                         </p>
                    ) : (
                         <p className="text-sm text-muted-foreground mt-1">
                            Pas assez de données pour une projection.
                         </p>
                    )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-500" />
                </div>
            </div>
         </Card>

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
                        {/* Animation de remplissage ajoutée ici */}
                        <Progress value={progressPercentage} className="h-3 [&>div]:animate-progress-fill [&>div]:duration-1000" />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{formatCurrency(totalPaid)} / {formatCurrency(debt.total_amount)}</p>
                </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Graphique Solde Restant */}
        <BalanceChart debt={debt} payments={payments} />

        {/* Monthly Stats (Graphique Paiements Mensuels) */}
        <MonthlyStats payments={payments} onExportPDF={handleExportPDF} />

        {/* Add Payment Button & Form */}
        {!showPaymentForm && (
          <Button onClick={() => setShowPaymentForm(true)} className="w-full" size="lg">
            <Plus className="w-5 h-5 mr-2" /> Ajouter un versement
          </Button>
        )}
        {showPaymentForm && (
          // Le formulaire est maintenant dans une Card dédiée
          <Card className="p-0 shadow-soft animate-fade-in overflow-hidden">
              <PaymentForm
                debtId={debt.id}
                onSuccess={() => setShowPaymentForm(false)} // Ferme le formulaire
                onCancel={() => setShowPaymentForm(false)}
              />
          </Card>
        )}

        {/* Payment History */}
        <PaymentHistory
          payments={payments}
          debtId={debt.id} // Nécessaire pour les mutations delete/update
        />
      </div>
    </div>
  );
};