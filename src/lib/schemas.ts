// src/lib/schemas.ts
import { z } from "zod";

export const debtSetupSchema = z.object({
  total_amount: z.coerce
    .number({ invalid_type_error: "Montant invalide" })
    .positive({ message: "Le montant doit être positif" }),
  description: z.string().optional(),
});

export type DebtSetupValues = z.infer<typeof debtSetupSchema>;

export const paymentFormSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Montant invalide" })
    .positive({ message: "Le montant doit être positif" }),
  payment_date: z.date({ required_error: "Date requise" }),
  note: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;