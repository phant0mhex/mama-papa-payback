// src/lib/schemas.ts
import { z } from "zod";

// Schéma pour le formulaire de configuration initiale de la dette
export const debtSetupSchema = z.object({
  total_amount: z.coerce // Convertit la valeur en nombre avant de valider
    .number({ invalid_type_error: "Montant invalide" })
    .positive({ message: "Le montant doit être positif" })
    .min(0.01, { message: "Le montant doit être d'au moins 0.01€" }), // Ajout d'un minimum
  description: z.string().max(280, "La description ne doit pas dépasser 280 caractères.").optional(), // La description est optionnelle et limitée
});

// Type dérivé du schéma pour les valeurs du formulaire
export type DebtSetupValues = z.infer<typeof debtSetupSchema>;

// Schéma pour le formulaire d'ajout/modification de paiement
export const paymentFormSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Montant invalide" })
    .positive({ message: "Le montant doit être positif" })
    .min(0.01, { message: "Le montant doit être d'au moins 0.01€" }),
  payment_date: z.date({
    required_error: "La date est requise",
    invalid_type_error: "Format de date invalide",
   }),
  note: z.string().max(280, "La note ne doit pas dépasser 280 caractères.").optional(), // Note optionnelle et limitée
});

// Type dérivé du schéma pour les valeurs du formulaire
export type PaymentFormValues = z.infer<typeof paymentFormSchema>;