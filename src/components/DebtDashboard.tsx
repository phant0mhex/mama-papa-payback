import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, TrendingDown, Wallet, CheckCircle2, Moon, Sun, Download } from "lucide-react"; // Ajout des icônes
import { PaymentForm } from "./PaymentForm";
import { PaymentHistory } from "./PaymentHistory";
import { MonthlyStats } from "./MonthlyStats";
import { exportToPDF } from "@/utils/pdfExport";
import { useTheme } from "next-themes"; // Ajout pour le thème
import {
  Tooltip,
  TooltipContent,
  // TooltipProvider, // Déjà dans App.tsx
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Ajout pour la barre de progression
import { Skeleton } from "@/components/ui/skeleton"; // Ajout pour le chargement

interface Debt {
  id: string;
  total_amount: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  created_at: string;
}

export const DebtDashboard = () => {
  const [debt, setDebt] = useState<Debt | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Commencer en chargement
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // setIsLoading(true); // Déplacé dans le try
    try {
      setIsLoading(true); // Mettre isLoading ici
      // Load debt
      const { data: debtData, error: debtError } = await supabase
        .from("debt")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (debtError) throw debtError;
      setDebt(debtData);

      // Load payments
      if (debtData) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .eq("debt_id", debtData.id)
          .order("payment_date", { ascending: false });

        if (paymentsError) throw paymentsError;
        setPayments(paymentsData || []);
      } else {
        setPayments([]); // Vider les paiements si pas de dette
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(`Erreur lors du chargement: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Recalculer quand debt ou payments change
  const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);
  const remaining = debt ? parseFloat(debt.total_amount.toString()) - totalPaid : 0;
  const progressPercentage = debt && debt.total_amount > 0 ? (totalPaid / parseFloat(debt.total_amount.toString())) * 100 : 0;

  const handleExportPDF = () => {
    if (!debt) return;
    try {
      // Trier les paiements par date (du plus ancien au plus récent) pour le PDF
      const sortedPayments = [...payments].sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());
      exportToPDF(debt, sortedPayments, totalPaid, remaining);
      toast.success("PDF exporté avec succès");
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-4xl mx-auto space-y-6">
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

  // Cas où la dette n'a pas pu être chargée
  if (!debt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-destructive mb-4">Impossible de charger les informations sur la dette.</p>
          <Button onClick={loadData}>Réessayer</Button>
        </div>
      </div>
    );
  }


  // Affichage normal
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
           {/* Bouton Thème */}
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
                <p className="text-3xl font-semibold">{debt.total_amount.toFixed(2)} €</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
          {/* ... autres cartes ... */}
           <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Déjà remboursé</p>
                <p className="text-3xl font-semibold text-success">{totalPaid.toFixed(2)} €</p>
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
                <p className="text-3xl font-semibold">{remaining.toFixed(2)} €</p>
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
                    {/* Appliquer l'animation définie */}
                    <Progress value={progressPercentage} className="h-3 animate-progress-fill transition-all duration-1000" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{totalPaid.toFixed(2)} € / {debt.total_amount.toFixed(2)} €</p>
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
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un versement
          </Button>
        )}

        {/* Payment Form */}
        {showPaymentForm && ( // Plus besoin de vérifier debt ici car déjà fait plus haut
          <PaymentForm
            debtId={debt.id}
            onSuccess={() => {
              loadData(); // Recharger les données après ajout
              setShowPaymentForm(false);
            }}
            onCancel={() => setShowPaymentForm(false)}
          />
        )}

        {/* Payment History */}
        <PaymentHistory
          payments={payments}
          onPaymentDeleted={loadData} // Recharger les données après suppression
        />
      </div>
    </div>
  );
}; // *** CETTE ACCOLADE MANQUAIT PROBABLEMENT ***