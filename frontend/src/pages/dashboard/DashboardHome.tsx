import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, TrendingUp, Clock, ArrowRight, Bell, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatKz } from "@/lib/format";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};
const statusLabels: Record<string, string> = {
  confirmed: "Confirmado", pending: "Pendente", completed: "Concluído", cancelled: "Cancelado",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, fin] = await Promise.all([api.dashboard.overview(), api.financial.summary()]);
        setOverview(ov);
        setFinancial(fin);

        if ((ov.low_stock_products || []).length > 0) {
          toast.warning(`Estoque baixo: ${ov.low_stock_products.length} produto(s) precisam de reposição`, { duration: 5000 });
        }
        const todayPending = (ov.upcoming_appointments || []).filter((a: any) => a.status === "pending");
        if (todayPending.length > 0) {
          toast.info(`${todayPending.length} agendamento(s) para hoje`, { duration: 4000 });
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar dashboard");
      }
    };

    load();
  }, []);

  const lowStockProducts = overview?.low_stock_products || [];
  const upcomingAppointments = overview?.upcoming_appointments || [];
  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return upcomingAppointments.filter((a: any) => a.date === today);
  }, [upcomingAppointments]);

  const revenueChartData =
    revenuePeriod === "daily"
      ? (financial?.daily_revenues || [])
      : revenuePeriod === "weekly"
        ? (financial?.weekly_revenues || [])
        : (financial?.revenue_by_month || []).map((m: any) => ({ ...m, value: m.revenue }));

  const revenueDataKey = revenuePeriod === "daily" ? "day" : revenuePeriod === "weekly" ? "week" : "month";

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Visão geral do seu salão hoje" />

      {(lowStockProducts.length > 0 || upcomingAppointments.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {lowStockProducts.length > 0 && (
            <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/30 shadow-sm flex-1 min-w-[280px] cursor-pointer" onClick={() => navigate("/dashboard/stock")}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800 text-xs">Estoque Baixo</p>
                  <p className="text-[11px] text-amber-700">{lowStockProducts.map((p: any) => p.name).join(", ")}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {upcomingAppointments.filter((a: any) => a.status === "pending").length > 0 && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/30 shadow-sm flex-1 min-w-[280px] cursor-pointer" onClick={() => navigate("/dashboard/agenda")}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800 text-xs">Agendamentos Pendentes</p>
                  <p className="text-[11px] text-blue-700">{upcomingAppointments.filter((a: any) => a.status === "pending").length} agendamento(s) aguardando confirmação</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Agendamentos Hoje" value={String(overview?.today_appointments || 0)} icon={Calendar} trend={{ value: 12, positive: true }} />
        <StatCard title="Receita Hoje" value={formatKz(overview?.today_revenue || 0)} icon={DollarSign} trend={{ value: 8, positive: true }} />
        <StatCard title="Receita Mensal" value={formatKz(overview?.month_revenue || 0)} icon={TrendingUp} trend={{ value: 15, positive: true }} />
        <StatCard title="Total de Clientes" value={String(overview?.total_clients || 0)} icon={Users} description={`+${overview?.new_clients_month || 0} este mês`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Faturamento
              </CardTitle>
              <Tabs value={revenuePeriod} onValueChange={(v) => setRevenuePeriod(v as any)}>
                <TabsList className="h-8">
                  <TabsTrigger value="daily" className="text-xs px-3 h-6">Diário</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs px-3 h-6">Semanal</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs px-3 h-6">Mensal</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey={revenueDataKey} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(value: number) => [formatKz(value), "Receita"]} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Agendamentos por Horário
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={overview?.appointments_by_hour || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Próximos Agendamentos
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/dashboard/agenda")}>Ver todos <ArrowRight className="ml-1 h-3 w-3" /></Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {todayAppointments.map((apt: any) => (
              <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {apt.client.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{apt.client}</p>
                    <p className="text-xs text-muted-foreground">{apt.service} • {apt.employee}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{apt.time}</span>
                  <Badge variant="outline" className={`text-[10px] px-2 ${statusColors[apt.status] || ""}`}>{statusLabels[apt.status] || apt.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
