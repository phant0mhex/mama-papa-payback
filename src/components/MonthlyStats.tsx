import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, parseISO } from "date-fns";
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

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  note: string | null;
}

interface MonthlyStatsProps {
  payments: Payment[];
  onExportPDF: () => void;
}

export const MonthlyStats = ({ payments, onExportPDF }: MonthlyStatsProps) => {
  // Group payments by month
  const getMonthlyData = () => {
    const currentYear = new Date().getFullYear();
    const months = eachMonthOfInterval({
      start: startOfYear(new Date(currentYear, 0, 1)),
      end: new Date(),
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthPayments = payments.filter((payment) => {
        const paymentDate = parseISO(payment.payment_date);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
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
  };

  const monthlyData = getMonthlyData();
  const totalThisMonth = monthlyData[monthlyData.length - 1]?.total || 0;
  const paymentsThisMonth = monthlyData[monthlyData.length - 1]?.count || 0;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Statistiques mensuelles
        </h2>
        <Button onClick={onExportPDF} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exporter PDF
        </Button>
      </div>

      {/* Current Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ce mois-ci</p>
              <p className="text-3xl font-semibold text-success">
                {totalThisMonth.toFixed(2)} €
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {paymentsThisMonth} versement{paymentsThisMonth > 1 ? "s" : ""}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft hover:shadow-soft-md transition-all">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Moyenne mensuelle</p>
            <p className="text-3xl font-semibold">
              {(
                monthlyData.reduce((sum, m) => sum + m.total, 0) / 
                monthlyData.filter(m => m.total > 0).length || 0
              ).toFixed(2)} €
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Sur {monthlyData.filter(m => m.total > 0).length} mois actifs
            </p>
          </div>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card className="p-6 shadow-soft">
        <h3 className="text-sm font-medium mb-4">Évolution mensuelle</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => `${value}€`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              formatter={(value: number) => [`${value.toFixed(2)} €`, "Montant"]}
            />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {monthlyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.total > 0 ? "hsl(var(--success))" : "hsl(var(--muted))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
