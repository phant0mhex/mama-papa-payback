// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fonction utilitaire pour combiner les classes Tailwind CSS, gérant les conflits.
 * @param inputs - Liste des classes à combiner.
 * @returns Une chaîne de caractères contenant les classes finales.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un nombre en devise (Euro) pour l'affichage.
 * Gère null, undefined et NaN.
 * @param amount - Le montant numérique à formater.
 * @returns Une chaîne de caractères formatée en Euro (ex: "1 234,56 €") ou "0,00 €".
 */
export function formatCurrency(amount: number | null | undefined): string {
  const numericAmount = Number(amount); // Tente de convertir
  if (amount === null || amount === undefined || isNaN(numericAmount)) {
    return "0,00 €"; // Retourne 0€ si invalide
  }
  // Utilise l'API Intl pour un formatage correct en français pour l'Euro
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2, // Toujours afficher 2 décimales
    maximumFractionDigits: 2
  }).format(numericAmount);
}