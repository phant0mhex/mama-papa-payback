// src/components/PaymentForm.tsx
import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar"; // Import Shadcn Calendar
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Import Popover
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
import { paymentFormSchema, PaymentFormValues } from "@/lib/schemas"; // Import schema

interface PaymentFormProps {
  debtId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentForm = ({ debtId, onSuccess, onCancel }: PaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: undefined,
      payment_date: new Date(), // Default to today
      note: "",
    },
  });

  const onSubmit = async (values: PaymentFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("payments").insert({
        debt_id: debtId,
        amount: values.amount,
        // Format date for Supabase (YYYY-MM-DD)
        payment_date: format(values.payment_date, "yyyy-MM-dd"),
        note: values.note || null,
      });

      if (error) throw error;

      toast.success("Versement ajouté avec succès");
      onSuccess();
    } catch (error: any) {
      console.error("Error creating payment:", error);
      toast.error(`Erreur lors de l'ajout: ${error.message || 'Erreur inconnue'}`);
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
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};