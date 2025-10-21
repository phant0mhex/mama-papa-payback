// src/components/DebtSetup.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Keep Label for consistency if needed outside form context
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { debtSetupSchema, DebtSetupValues } from "@/lib/schemas"; // Import schema

interface DebtSetupProps {
  onDebtCreated: () => void;
}

export const DebtSetup = ({ onDebtCreated }: DebtSetupProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DebtSetupValues>({
    resolver: zodResolver(debtSetupSchema),
    defaultValues: {
      total_amount: undefined, // Use undefined for placeholder to show
      description: "",
    },
  });

  const onSubmit = async (values: DebtSetupValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("debt")
        .insert({
          total_amount: values.total_amount,
          description: values.description || null,
        });

      if (error) throw error;

      toast.success("Dette créée avec succès");
      onDebtCreated();
    } catch (error: any) { // Catch specific error
      console.error("Error creating debt:", error);
      toast.error(`Erreur lors de la création: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/20">
      <Card className="w-full max-w-md p-8 shadow-soft-lg animate-scale-in">
        {/* ... (Icon, Title, Description remain the same) ... */}
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="total_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="amount">Montant total (€)</FormLabel>
                  <FormControl>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="5000.00"
                      {...field}
                      className="text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="description">Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="description"
                      placeholder="Prêt pour le projet..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !form.formState.isValid} // Disable if loading or form invalid
            >
              {isLoading ? "Création..." : "Créer la dette"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
};