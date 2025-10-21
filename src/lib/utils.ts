import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


/**
 * Formate un nombre en devise (Euro) pour l'affichage.
 * @param amount - Le montant numérique à formater. Peut être null ou undefined.
 * @returns Une chaîne de caractères formatée en Euro (ex: "1 234,56 €") ou "0,00 €" si l'entrée est invalide.
 */
export function formatCurrency(amount: number | null | undefined): string {
  // Si le montant est null, undefined ou NaN après conversion, retourne "0,00 €"
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "0,00 €";
  }
  // Utilise l'API Intl pour un formatage correct en français pour l'Euro
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2, // Toujours afficher 2 décimales
    maximumFractionDigits: 2
  }).format(Number(amount)); // Assure que la valeur est un nombre
}