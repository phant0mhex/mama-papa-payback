// src/components/PaymentForm.tsx
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react"; // Ajout useEffect
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// import { supabase } from "@/integrations/supabase/client"; // Plus besoin ici
// import { toast } from "sonner"; // Géré dans le hook
import { paymentFormSchema, PaymentFormValues } from "@/lib/schemas";
import { useAddPaymentMutation, useUpdatePaymentMutation, Payment, NewPaymentData } from "@/hooks/usePaymentsData"; // Importer la mutation

interface PaymentFormProps {
  debtId: string;
  paymentToEdit?: Payment | null; // Nouvelle prop optionnelle
  onSuccess: () => void; // Gardé pour fermer le formulaire après succès
  onCancel: () => void;
}

export const PaymentForm = ({ debtId, paymentToEdit = null, onSuccess, onCancel }: PaymentFormProps) => {
  const addPaymentMutation = useAddPaymentMutation();
  const updatePaymentMutation = useUpdatePaymentMutation();

  const isEditing = !!paymentToEdit;
  const currentMutation = isEditing ? updatePaymentMutation : addPaymentMutation;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    // Les valeurs par défaut seront définies dans useEffect si edition
    defaultValues: {
      amount: undefined,
      payment_date: new Date(),
      note: "",
    },
    mode: "onChange",
  });

  // Pré-remplir le formulaire si on est en mode édition
  useEffect(() => {
    if (isEditing && paymentToEdit) {
      form.reset({
        amount: parseFloat(paymentToEdit.amount.toString()), // Assurer que c'est un nombre
        payment_date: parseISO(paymentToEdit.payment_date), // Convertir la string ISO en objet Date
        note: paymentToEdit.note || "",
      });
    } else {
        // S'assurer de réinitialiser si on passe d'édition à ajout sans démonter
         form.reset({
            amount: undefined,
            payment_date: new Date(),
            note: "",
        });
    }
  }, [paymentToEdit, isEditing, form]); // form est inclus dans les dépendances de reset


  const onSubmit = (values: PaymentFormValues) => {
    if (isEditing && paymentToEdit) {
      // Appel de la mutation de mise à jour
      updatePaymentMutation.mutate(
        { paymentId: paymentToEdit.id, updatedData: values, debtId },
        { onSuccess } // Appelle onSuccess pour fermer le formulaire/dialog
      );
    } else {
      // Appel de la mutation d'ajout
      const paymentData = {
        amount: values.amount,
        payment_date: values.payment_date,
        note: values.note || null,
      };
      addPaymentMutation.mutate(
        { debtId, paymentData },
        { onSuccess } // Appelle onSuccess pour fermer le formulaire/dialog
      );
    }
  };

  return (
    // Utiliser Dialog si appelé depuis PaymentHistory, sinon Card
    // Pour simplifier, on garde Card mais on ajuste le titre
    <Card className="p-6 shadow-soft animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {isEditing ? "Modifier le versement" : "Nouveau versement"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel} disabled={currentMutation.isPending}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Les FormField restent les mêmes qu'avant */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
               <FormItem>
                <FormLabel htmlFor="payment-amount">Montant (€)</FormLabel>
                <FormControl>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    placeholder="250.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="payment_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date du versement</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={currentMutation.isPending}
                      >
                        {field.value ? (
                          format(field.value, "dd MMMM yyyy", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
               <FormItem>
                <FormLabel htmlFor="note">Note (optionnel)</FormLabel>
                <FormControl>
                  <Textarea
                    id="note"
                    placeholder="Ajouter une note..."
                    rows={2}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={currentMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={currentMutation.isPending || !form.formState.isValid}
              className="flex-1"
            >
              {currentMutation.isPending
                ? (isEditing ? "Modification..." : "Ajout...")
                : (isEditing ? "Enregistrer les modifications" : "Ajouter")}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};