// src/components/DebtEditForm.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { debtSetupSchema, DebtSetupValues } from "@/lib/schemas"; // Réutilise le même schéma
import { useUpdateDebtMutation, type Debt } from "@/hooks/useDebtData"; // Importer la mutation et le type Debt

interface DebtEditFormProps {
  debt: Debt; // La dette actuelle à modifier (non nullable ici)
  onSuccess: () => void; // Callback pour fermer le formulaire/dialog après succès
  onCancel: () => void;
}

export const DebtEditForm = ({ debt, onSuccess, onCancel }: DebtEditFormProps) => {
  const updateDebtMutation = useUpdateDebtMutation();

  const form = useForm<DebtSetupValues>({
    resolver: zodResolver(debtSetupSchema),
    // Les valeurs par défaut seront définies dans useEffect
    defaultValues: {
      total_amount: parseFloat(debt.total_amount.toString()) || undefined, // Pré-remplir
      description: debt.description || "", // Pré-remplir
    },
    mode: "onChange", // Valider au changement
  });

  // Pas besoin de useEffect si defaultValues est bien initialisé
  // useEffect(() => {
  //   form.reset({
  //       total_amount: parseFloat(debt.total_amount.toString()),
  //       description: debt.description || "",
  //     });
  // }, [debt, form]);

  const onSubmit = (values: DebtSetupValues) => {
    updateDebtMutation.mutate(
      { debtId: debt.id, updatedData: values },
      {
        onSuccess: () => {
          onSuccess(); // Appelle le callback pour fermer après succès
        },
        // onError géré dans le hook
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="total_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="edit-amount">Montant total (€)</FormLabel>
              <FormControl>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="5000.00"
                  {...field}
                  value={field.value ?? ''}
                   // Utilisation de '+' pour convertir en nombre, fallback à undefined si vide
                  onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
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
              <FormLabel htmlFor="edit-description">Description (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  id="edit-description"
                  placeholder="Prêt pour le projet..."
                  rows={3}
                  {...field}
                  value={field.value ?? ''} // Gérer la valeur potentiellement null
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateDebtMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            // Désactivé si en cours, si invalide, OU si pas modifié (isDirty)
            disabled={updateDebtMutation.isPending || !form.formState.isValid || !form.formState.isDirty}
          >
            {updateDebtMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};