// src/components/BalanceChart.tsx
import { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { type Debt, type Payment } from '@/services/supabaseService'; // Importer les types depuis le service
import { formatCurrency } from '@/lib/utils'; // Importer notre fonction de formatage

interface BalanceChartProps {
  debt: Debt | null;
  payments: Payment[];
}

// Fonction pour formater les ticks de l'axe Y (ex: 1k€)
const formatCurrencyTick = (value: number): string => {
    if (value >= 1000 || value <= -1000) return `${(value / 1000).toFixed(0)}k€`;
    return `${value.toFixed(0)}€`;
};

// Fonction pour formater les ticks de l'axe X (ex: Oct 25)
const formatDateTick = (dateStr: string): string => {
    try {
        // Tente de parser la date ISO (pour les paiements) ou la date avec timezone (pour debt.created_at)
        const date = parseISO(dateStr);
        return format(date, 'MMM yy', { locale: fr });
    } catch {
        return dateStr; // Fallback si le format est inattendu
    }
};

// Formatter le label du Tooltip (Date)
const formatTooltipLabel = (label: string): string => {
     try {
        const date = parseISO(label);
        return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch {
        return label;
    }
};


export const BalanceChart = ({ debt, payments }: BalanceChartProps) => {
  // Calculer les données du graphique avec useMemo pour l'optimisation
  const chartData = useMemo(() => {
    if (!debt?.total_amount || !Array.isArray(payments)) return [];

    // Trier les paiements par date croissante pour calculer le solde chronologiquement
    const sortedPayments = [...payments].sort(
      (a, b) => parseISO(a.payment_date).getTime() - parseISO(b.payment_date).getTime()
    );

    let currentBalance = parseFloat(debt.total_amount.toString());
    const data: { date: string; Solde: number }[] = [];

    // Point de départ: la date de création de la dette
    // Assurer que created_at est une date valide avant de l'utiliser
    try {
        parseISO(debt.created_at); // Tente de parser pour valider
        data.push({ date: debt.created_at, Solde: currentBalance });
    } catch {
        // Si created_at n'est pas valide, essayer de prendre la date du premier paiement comme départ
        if (sortedPayments.length > 0) {
             data.push({ date: sortedPayments[0].payment_date, Solde: currentBalance });
             // Ajuster la boucle pour commencer après ce paiement si on l'utilise comme point 0
        } else {
             // Si pas de paiement et date invalide, on ne peut rien afficher
             return [];
        }
        console.warn("Invalid debt.created_at date format:", debt.created_at);
    }


    // Ajouter un point pour chaque paiement, mettant à jour le solde
    sortedPayments.forEach(payment => {
      // Vérifier si la date du paiement est après la dernière date enregistrée (évite doublons si created_at = 1er paiement)
      const lastDateStr = data[data.length - 1]?.date;
      if (lastDateStr && parseISO(payment.payment_date) <= parseISO(lastDateStr)) {
          // Si la date est la même ou antérieure, on met à jour le solde du dernier point existant
          // Ceci peut arriver si plusieurs paiements ont lieu le même jour ou si created_at = 1er paiement
          const paymentAmount = parseFloat(payment.amount.toString());
          data[data.length - 1].Solde = Math.max(0, data[data.length - 1].Solde - paymentAmount);
      } else {
          // Sinon, on ajoute un nouveau point
          currentBalance -= parseFloat(payment.amount.toString());
          // S'assurer que le solde ne descend pas en dessous de 0 pour le graphique
          const balanceToShow = Math.max(0, currentBalance);
          data.push({ date: payment.payment_date, Solde: balanceToShow });
      }
    });

    // Retourner les données formatées pour le graphique
    return data;
  }, [debt, payments]); // Recalculer si la dette ou les paiements changent

  // Ne pas afficher le graphique s'il n'y a pas assez de données (moins de 2 points)
  if (!debt || chartData.length < 2) {
    return (
        <Card className="p-6 shadow-soft animate-fade-in-up text-center">
            <p className="text-sm text-muted-foreground">Pas assez de données pour afficher l'évolution du solde.</p>
        </Card>
    );
  }

  return (
    <Card className="p-6 shadow-soft animate-fade-in-up">
      <h3 className="text-sm font-medium mb-4 text-muted-foreground">Évolution du solde restant</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /> {/* Lignes horizontales seulement */}
          <XAxis
            dataKey="date"
            tickFormatter={formatDateTick}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} // Police plus petite
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd" // S'assurer que le début et la fin sont affichés
            minTickGap={40} // Augmenter l'espace minimum requis
             // dy={5} // Descendre légèrement les labels
          />
          <YAxis
            tickFormatter={formatCurrencyTick}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
            width={55} // Un peu plus de largeur pour les labels
            tickMargin={5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              borderColor: "hsl(var(--border))",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-md)",
              padding: "8px 12px",
            }}
             labelStyle={{ // Style pour la date dans le tooltip
                marginBottom: "4px",
                fontWeight: "500",
                color: "hsl(var(--foreground))",
             }}
             itemStyle={{ // Style pour la ligne "Solde: xxx €"
                fontSize: "12px",
             }}
            formatter={(value: number, name: string) => [
              formatCurrency(value), // Utilise notre fonction de formatage
              name, // Garde "Solde" comme nom
            ]}
            labelFormatter={formatTooltipLabel} // Utilise notre formateur de date
          />
          <Line
            type="monotone" // Ligne courbe
            dataKey="Solde"
            stroke="hsl(var(--primary))" // Couleur primaire du thème
            strokeWidth={2.5} // Ligne un peu plus épaisse
            dot={{ r: 0, strokeWidth: 0 }} // Cache les points normaux
            activeDot={{ // Style du point au survol
                r: 5,
                strokeWidth: 2,
                fill: "hsl(var(--background))", // Fond comme le background
                stroke: "hsl(var(--primary))" // Contour couleur primaire
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};