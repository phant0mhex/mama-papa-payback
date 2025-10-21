import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  created_at: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
  onPaymentDeleted: () => void;
}

export const PaymentHistory = ({ payments, onPaymentDeleted }: PaymentHistoryProps) => {
  const handleDelete = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;

      toast.success("Versement supprimé");
      onPaymentDeleted();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (payments.length === 0) {
    return (
      <Card className="p-12 shadow-soft text-center">
        <p className="text-muted-foreground">Aucun versement enregistré</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Historique des versements</h2>
      
      <div className="space-y-2">
        {payments.map((payment) => (
          <Card key={payment.id} className="p-4 shadow-soft hover:shadow-soft-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-2xl font-semibold">{parseFloat(payment.amount.toString()).toFixed(2)} €</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(payment.payment_date), "dd MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                </div>

                {payment.note && (
                  <div className="flex items-start gap-1 mt-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <p className="text-muted-foreground">{payment.note}</p>
                  </div>
                )}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce versement ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Le versement de {parseFloat(payment.amount.toString()).toFixed(2)} € sera supprimé définitivement.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(payment.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
