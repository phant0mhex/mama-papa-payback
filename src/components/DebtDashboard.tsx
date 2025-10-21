import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, TrendingDown, Wallet, CheckCircle2 } from "lucide-react";
import { PaymentForm } from "./PaymentForm";
import { PaymentHistory } from "./PaymentHistory";
import { MonthlyStats } from "./MonthlyStats";
import { exportToPDF } from "@/utils/pdfExport";

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
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
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
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);
  const remaining = debt ? parseFloat(debt.total_amount.toString()) - totalPaid : 0;
  const progressPercentage = debt ? (totalPaid / parseFloat(debt.total_amount.toString())) * 100 : 0;

  const handleExportPDF = () => {
    if (!debt) return;
    
    try {
      exportToPDF(debt, payments, totalPaid, remaining);
      toast.success("PDF exporté avec succès");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Erreur lors de l'export PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Suivi de remboursement</h1>
            {debt?.description && (
              <p className="text-muted-foreground mt-1">{debt.description}</p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Dette totale</p>
                <p className="text-3xl font-semibold">{debt?.total_amount.toFixed(2)} €</p>
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
            <div className="relative">
              <Progress value={progressPercentage} className="h-3" />
            </div>
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
        {showPaymentForm && debt && (
          <PaymentForm
            debtId={debt.id}
            onSuccess={() => {
              loadData();
              setShowPaymentForm(false);
            }}
            onCancel={() => setShowPaymentForm(false)}
          />
        )}

        {/* Payment History */}
        <PaymentHistory 
          payments={payments} 
          onPaymentDeleted={loadData}
        />
      </div>
    </div>
  );
};
