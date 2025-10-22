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
import { type Debt, type Payment } from '@/services/supabaseService';
import { formatCurrency } from '@/lib/utils';

interface BalanceChartProps {
  debt: Debt | null;
  payments: Payment[];
}

const formatCurrencyTick = (value: number): string => {
    if (value >= 1000 || value <= -1000) return `${(value / 1000).toFixed(0)}k€`;
    return `${value.toFixed(0)}€`;
};

const formatDateTick = (dateStr: string): string => {
    try {
        const date = parseISO(dateStr);
        // Utiliser 'MMM yy' pour plus de concision si beaucoup de points
        return format(date, 'MMM yy', { locale: fr });
    } catch {
        return dateStr;
    }
};

const formatTooltipLabel = (label: string): string => {
     try {
        const date = parseISO(label);
        return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch {
        return label;
    }
};


export const BalanceChart = ({ debt, payments }: BalanceChartProps) => {
  const chartData = useMemo(() => {
    // ... (logique de calcul chartData inchangée) ...
    if (!debt?.total_amount || !Array.isArray(payments)) return [];

    const sortedPayments = [...payments].sort(
      (a, b) => parseISO(a.payment_date).getTime() - parseISO(b.payment_date).getTime()
    );

    let currentBalance = parseFloat(debt.total_amount.toString());
    const data: { date: string; Solde: number }[] = [];

    try {
        parseISO(debt.created_at);
        data.push({ date: debt.created_at, Solde: currentBalance });
    } catch {
        if (sortedPayments.length > 0) {
             data.push({ date: sortedPayments[0].payment_date, Solde: currentBalance });
        } else {
             return [];
        }
        console.warn("Invalid debt.created_at date format:", debt.created_at);
    }

    sortedPayments.forEach(payment => {
      const lastDateStr = data[data.length - 1]?.date;
      if (lastDateStr && parseISO(payment.payment_date) <= parseISO(lastDateStr)) {
          const paymentAmount = parseFloat(payment.amount.toString());
          data[data.length - 1].Solde = Math.max(0, data[data.length - 1].Solde - paymentAmount);
      } else {
          currentBalance -= parseFloat(payment.amount.toString());
          const balanceToShow = Math.max(0, currentBalance);
          data.push({ date: payment.payment_date, Solde: balanceToShow });
      }
    });
    return data;
  }, [debt, payments]);

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
          {/* Grille horizontale seulement */}
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateTick}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false} // Masquer la ligne de l'axe X
            tickLine={false} // Masquer les petits traits (ticks) de l'axe X
            interval="preserveStartEnd"
            minTickGap={40} // Augmenter l'espace minimum entre les labels
            // dy={5} // Optionnel: décaler les labels vers le bas
          />
          <YAxis
            tickFormatter={formatCurrencyTick}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false} // Masquer la ligne de l'axe Y
            tickLine={false} // Masquer les petits traits (ticks) de l'axe Y
            domain={['auto', 'auto']} // Laisser Recharts déterminer le min/max
            width={55}
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
             labelStyle={{
                marginBottom: "4px",
                fontWeight: "500",
                color: "hsl(var(--foreground))",
             }}
             itemStyle={{ fontSize: "12px" }}
            formatter={(value: number, name: string) => [ formatCurrency(value), name ]}
            labelFormatter={formatTooltipLabel}
          />
          <Line
            type="monotone"
            dataKey="Solde"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={{ r: 0, strokeWidth: 0 }} // Pas de points par défaut
            activeDot={{ // Point visible au survol
                r: 5,
                strokeWidth: 2,
                fill: "hsl(var(--background))",
                stroke: "hsl(var(--primary))"
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};