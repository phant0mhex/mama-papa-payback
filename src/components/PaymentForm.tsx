// src/components/PaymentForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
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
import { useAddPaymentMutation, NewPaymentData } from "@/hooks/usePaymentsData"; // Importer la mutation

interface PaymentFormProps {
  debtId: string;
  onSuccess: () => void; // Gardé pour fermer le formulaire après succès
  onCancel: () => void;
}

export const PaymentForm = ({ debtId, onSuccess, onCancel }: PaymentFormProps) => {
  const addPaymentMutation = useAddPaymentMutation(); // Utilise le hook de mutation

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: undefined,
      payment_date: new Date(), // Date par défaut: aujourd'hui
      note: "",
    },
    mode: "onChange",
  });

  const onSubmit = (values: PaymentFormValues) => {
    const paymentData: NewPaymentData = {
        amount: values.amount,
        payment_date: values.payment_date, // Le service formatera la date
        note: values.note || null,
    };
    addPaymentMutation.mutate(
      { debtId, paymentData },
      {
        onSuccess: () => {
          onSuccess(); // Appelle onSuccess (pour fermer le form) seulement après succès de la mutation
          form.reset(); // Réinitialise le formulaire
        },
        // onError est géré globalement dans le hook
      }
    );
  };

  return (
    <Card className="p-6 shadow-soft animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Nouveau versement</h2>
        <Button variant="ghost" size="icon" onClick={onCancel} disabled={addPaymentMutation.isPending}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        disabled={addPaymentMutation.isPending} // Désactiver pendant la mutation
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
              disabled={addPaymentMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={addPaymentMutation.isPending || !form.formState.isValid}
              className="flex-1"
            >
              {addPaymentMutation.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};