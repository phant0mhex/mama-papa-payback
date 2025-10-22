// src/components/MonthlyStats.tsx
import { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, parseISO, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { type Payment } from '@/services/supabaseService';
import { formatCurrency } from '@/lib/utils';

interface MonthlyStatsProps {
  payments: Payment[];
  onExportPDF: () => void;
}

const formatBarTooltipValue = (value: number, name: string, props: any) => {
    const count = props.payload.count;
    const paymentText = `${count} versement${count !== 1 ? "s" : ""}`;
    return [`${formatCurrency(value)} (${paymentText})`, "Total ce mois"];
};

export const MonthlyStats = ({ payments, onExportPDF }: MonthlyStatsProps) => {

  // Définir currentYear ici pour qu'elle soit accessible partout dans le composant
  const currentYear = getYear(new Date()); // <--- DÉPLACER ICI

  // Utilisation de useMemo pour les calculs
  const { monthlyData, totalThisMonth, paymentsThisMonth, averageMonthlyPayment, activeMonthsCount } = useMemo(() => {
    // const currentYear = getYear(new Date()); // <-- Supprimer d'ici

    // Crée les mois de Janvier à Décembre de l'année actuelle
    const yearMonths = eachMonthOfInterval({
      start: startOfYear(new Date(currentYear, 0, 1)),
      end: new Date(currentYear, 11, 31),
    });

    // ... (le reste de la logique useMemo reste identique) ...
    const data = yearMonths.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = new Date() < endOfMonth(month) ? new Date() : endOfMonth(month);

      const monthPayments = payments.filter((payment) => {
        try {
            const paymentDate = parseISO(payment.payment_date);
            return !isNaN(paymentDate.getTime()) && paymentDate >= monthStart && paymentDate <= monthEnd;
        } catch {
            return false;
        }
      });

      const total = monthPayments.reduce(
        (sum, payment) => sum + parseFloat(payment.amount.toString()),
        0
      );

      return {
        month: format(month, "MMM", { locale: fr }),
        total: total,
        count: monthPayments.length,
      };
    });

    const currentMonthData = data.find(d => d.month === format(new Date(), "MMM", { locale: fr }));
    const totThisMonth = currentMonthData?.total || 0;
    const payThisMonth = currentMonthData?.count || 0;

    const activeMonths = data.filter(m => m.total > 0);
    const actMonthsCount = activeMonths.length;
    const totalPaidAcrossMonths = activeMonths.reduce((sum, m) => sum + m.total, 0);
    const avgPayment = actMonthsCount > 0 ? totalPaidAcrossMonths / actMonthsCount : 0;

    return {
        monthlyData: data,
        totalThisMonth: totThisMonth,
        paymentsThisMonth: payThisMonth,
        averageMonthlyPayment: avgPayment,
        activeMonthsCount: actMonthsCount,
    };

  }, [payments, currentYear]); // Ajouter currentYear aux dépendances de useMemo

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Statistiques mensuelles ({currentYear}) {/* Utiliser la variable ici */}
        </h2>
        {/* ... (bouton Export PDF) ... */}
         <Button onClick={onExportPDF} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exporter PDF
        </Button>
      </div>

      {/* ... (Cartes Stats mois courant et moyenne) ... */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ce mois-ci ({format(new Date(), 'MMMM', {locale: fr})})</p>
              <p className="text-3xl font-semibold text-success">
                {formatCurrency(totalThisMonth)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {paymentsThisMonth} versement{paymentsThisMonth !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>
         <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all">
           <div className="flex items-start justify-between">
              <div>
                  <p className="text-sm text-muted-foreground mb-1">Moyenne mensuelle</p>
                  <p className="text-3xl font-semibold">
                  {formatCurrency(averageMonthlyPayment)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                  Sur {activeMonthsCount} mois actifs
                  </p>
              </div>
           </div>
        </Card>
      </div>


      {/* Monthly Chart */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-sm font-medium mb-4 text-muted-foreground">Évolution mensuelle des versements</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
            {/* ... (Grid, Axes, Bar, Cell) ... */}
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={5}
            />
            <YAxis
              tickFormatter={(value) => `${value}€`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickMargin={5}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
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
               itemStyle={{ fontSize: "12px",
                color: "hsl(var(--success))",
                }}
              formatter={formatBarTooltipValue}
              // Utiliser la variable currentYear définie en dehors de useMemo
              labelFormatter={(label) => `${label} ${currentYear}`} // <--- ICI
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {monthlyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.total > 0 ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.5)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};