import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X } from "lucide-react";

interface PaymentFormProps {
  debtId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentForm = ({ debtId, onSuccess, onCancel }: PaymentFormProps) => {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("payments").insert({
        debt_id: debtId,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        note: note || null,
      });

      if (error) throw error;

      toast.success("Versement ajouté avec succès");
      onSuccess();
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Erreur lors de l'ajout du versement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 shadow-soft animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Nouveau versement</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment-amount">Montant (€)</Label>
          <Input
            id="payment-amount"
            type="number"
            step="0.01"
            placeholder="250.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-date">Date du versement</Label>
          <Input
            id="payment-date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note (optionnel)</Label>
          <Textarea
            id="note"
            placeholder="Ajouter une note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Ajout..." : "Ajouter"}
          </Button>
        </div>
      </form>
    </Card>
  );
};
