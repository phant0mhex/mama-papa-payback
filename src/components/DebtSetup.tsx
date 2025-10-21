import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

interface DebtSetupProps {
  onDebtCreated: () => void;
}

export const DebtSetup = ({ onDebtCreated }: DebtSetupProps) => {
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("debt")
        .insert({
          total_amount: parseFloat(totalAmount),
          description: description || null,
        });

      if (error) throw error;

      toast.success("Dette créée avec succès");
      onDebtCreated();
    } catch (error) {
      console.error("Error creating debt:", error);
      toast.error("Erreur lors de la création de la dette");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/20">
      <Card className="w-full max-w-md p-8 shadow-soft-lg animate-scale-in">
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-accent" />
          </div>
        </div>
        
        <h1 className="text-3xl font-semibold text-center mb-2">
          Configuration initiale
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Définissez le montant total de votre dette
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Montant total (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="5000.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Prêt pour le projet..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Création..." : "Créer la dette"}
          </Button>
        </form>
      </Card>
    </div>
  );
};
