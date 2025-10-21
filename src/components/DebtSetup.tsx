// src/components/DebtSetup.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Wallet } from "lucide-react";
import { debtSetupSchema, DebtSetupValues } from "@/lib/schemas";
import { useAddDebtMutation } from "@/hooks/useDebtData"; // Importer la mutation
import { NewDebtData } from '@/services/supabaseService'; // Importer le type depuis le service

// Interface retirée car on n'utilise plus onDebtCreated
// interface DebtSetupProps {
//   onDebtCreated: () => void;
// }

export const DebtSetup = (/*{ onDebtCreated }: DebtSetupProps*/) => {
  const addDebtMutation = useAddDebtMutation(); // Utilise le hook de mutation

  const form = useForm<DebtSetupValues>({
    resolver: zodResolver(debtSetupSchema),
    defaultValues: {
      total_amount: undefined,
      description: "",
    },
    mode: "onChange", // Valide au changement pour activer/désactiver le bouton
  });

  // La fonction onSubmit appelle la mutation
  const onSubmit = (values: DebtSetupValues) => {
    const debtData: NewDebtData = {
        total_amount: values.total_amount,
        description: values.description || null,
    };
    addDebtMutation.mutate(debtData); // Déclenche la mutation
    // Pas besoin d'appeler onDebtCreated, l'invalidation dans le hook s'en charge
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/20">
      <Card className="w-full max-w-md p-8 shadow-soft-lg animate-scale-in">
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
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
                      // Assurer que la valeur est bien un nombre pour l'input, ou vide
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                      className="text-lg"
                    />
                  </FormControl>
                  <FormMessage /> {/* Affiche l'erreur Zod */}
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
                      value={field.value ?? ''} // Gérer null/undefined
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
              // Désactivé si la mutation est en cours OU si le formulaire n'est pas valide
              disabled={addDebtMutation.isPending || !form.formState.isValid}
            >
              {addDebtMutation.isPending ? "Création..." : "Créer la dette"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
};