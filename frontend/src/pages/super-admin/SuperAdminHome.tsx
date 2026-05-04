import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, LifeBuoy, Sparkles, ArrowRight, AlertTriangle, Activity, Trophy, Zap, Bell, Plus, Download } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatKz } from "@/lib/format";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))"];

const statusVariant: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  trial: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  suspended: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  expired: "bg-destructive/10 text-destructive border-destructive/30",
};
const statusLabel: Record<string, string> = { active: "Ativa", trial: "Trial", suspended: "Suspensa", expired: "Expirada" };

const SuperAdminHome = () => {
  const navigate = useNavigate();
  const [pulse, setPulse] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => p + 1), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([api.superAdmin.stats(), api.superAdmin.tenants(), api.superAdmin.tickets(), api.superAdmin.logs()])
      .then(([s, ts, tk, lg]) => {
        setStats(s);
        setTenants(ts);
        setTickets(tk);
        setLogs(lg);
      })
      .catch((e: any) => toast.error(e.message || "Erro ao carregar visão geral"));
  }, []);

  const recentTenants = useMemo(() => [...tenants].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5), [tenants]);
  const openTickets = useMemo(() => tickets.filter(t => t.status !== "resolved").slice(0, 4), [tickets]);
  const topRevenue = useMemo(() => [...tenants].sort((a, b) => b.monthly_revenue - a.monthly_revenue).slice(0, 5), [tenants]);
  const criticalAlerts = useMemo(() => tenants.filter(t => t.status === "suspended" || t.status === "expired"), [tenants]);
  const liveLogs = useMemo(() => logs.slice(0, 5), [logs]);
  const maxRev = Math.max(...topRevenue.map(t => t.monthly_revenue || 0), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <PageHeader title="Visão Geral da Plataforma" subtitle="Monitorização global de todas as empresas GenOmni Salon" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Snapshot da plataforma exportado")}><Download className="h-4 w-4" /> Exportar snapshot</Button>
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/super-admin/tenants")}><Plus className="h-4 w-4" /> Nova empresa</Button>
        </div>
      </div>

      {criticalAlerts.length > 0 && (
        <Card className="shadow-card border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div className="flex-1 min-w-0"><p className="font-semibold text-sm">{criticalAlerts.length} empresas requerem atenção</p><p className="text-xs text-muted-foreground mt-0.5">{criticalAlerts.map(t => t.name).join(" • ")}</p></div>
            <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => navigate("/super-admin/tenants")}>Resolver <ArrowRight className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => navigate("/super-admin/tenants")} className="text-left"><StatCard title="Empresas Cadastradas" value={String(stats?.total_tenants || 0)} description={`${stats?.active_tenants || 0} ativas`} icon={Building2} /></button>
        <button onClick={() => navigate("/super-admin/tenants")} className="text-left"><StatCard title="MRR (Receita Mensal)" value={formatKz(stats?.monthly_recurring_revenue || 0)} description="Recorrente" icon={TrendingUp} trend={{ value: 9, positive: true }} /></button>
        <button onClick={() => navigate("/super-admin/tenants?status=trial")} className="text-left"><StatCard title="Trials Ativos" value={String(stats?.trial_tenants || 0)} description="Período de teste" icon={Sparkles} /></button>
        <button onClick={() => navigate("/super-admin/support")} className="text-left"><StatCard title="Tickets Abertos" value={String(stats?.open_tickets || 0)} description="Suporte técnico" icon={LifeBuoy} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-card lg:col-span-2 hover:shadow-soft transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-lg">Crescimento da Plataforma</CardTitle>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><TrendingUp className="h-3 w-3 mr-1" /> +9% MoM</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats?.growth_by_month || []}>
                <defs>
                  <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} /><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="tenants" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorTenants)" name="Empresas" />
                <Area yAxisId="right" type="monotone" dataKey="mrr" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#colorMrr)" name="MRR (Kz)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-soft transition-shadow">
          <CardHeader><CardTitle className="font-serif text-lg">Distribuição por Plano</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stats?.tenants_by_plan || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {(stats?.tenants_by_plan || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-card lg:col-span-2 hover:shadow-soft transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="font-serif text-lg flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> Top Empresas por Receita</CardTitle><Button variant="ghost" size="sm" onClick={() => navigate("/super-admin/tenants")}>Ver todas <ArrowRight className="h-4 w-4" /></Button></CardHeader>
          <CardContent className="space-y-3">
            {topRevenue.map((t, i) => (
              <button key={t.id} onClick={() => navigate("/super-admin/tenants")} className="w-full flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-accent/5 hover:border-accent/30 transition-all text-left group">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-white" : i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-white" : i === 2 ? "bg-gradient-to-br from-orange-400 to-orange-700 text-white" : "bg-muted text-muted-foreground"}`}>#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1"><p className="font-medium text-sm truncate">{t.name}</p><p className="text-sm font-bold text-primary">{formatKz(t.monthly_revenue)}</p></div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${(t.monthly_revenue / maxRev) * 100}%` }} /></div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
            {topRevenue.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Ainda não existem empresas com receita registada.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-soft transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="font-serif text-lg flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-500" /> Atividade ao Vivo</CardTitle><span className="flex items-center gap-1.5 text-xs text-emerald-600"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>ao vivo</span></CardHeader>
          <CardContent className="space-y-3">
            {liveLogs.map((log, idx) => (
              <div key={`${log.id}-${pulse}`} className="flex items-start gap-2 text-xs animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1"><p className="font-medium truncate">{log.tenant}</p><p className="text-muted-foreground truncate">{log.action}</p><p className="text-[10px] text-muted-foreground/70 mt-0.5">{log.timestamp}</p></div>
              </div>
            ))}
            {liveLogs.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma atividade registada ainda.</p>
            )}
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/super-admin/logs")}>Ver todos os logs <ArrowRight className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card hover:shadow-soft transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="font-serif text-lg flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Empresas Recentes</CardTitle><Button variant="ghost" size="sm" onClick={() => navigate("/super-admin/tenants")}>Ver <ArrowRight className="h-4 w-4" /></Button></CardHeader>
          <CardContent className="space-y-3">
            {recentTenants.map(t => (
              <button key={t.id} onClick={() => navigate("/super-admin/tenants")} className="w-full flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-left">
                <div className="min-w-0 flex-1"><p className="font-medium text-sm truncate">{t.name}</p><p className="text-xs text-muted-foreground">{t.city} • {t.plan} • {t.users} utilizadores</p></div>
                <Badge variant="outline" className={statusVariant[t.status]}>{statusLabel[t.status]}</Badge>
              </button>
            ))}
            {recentTenants.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-soft transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="font-serif text-lg flex items-center gap-2"><Bell className="h-4 w-4 text-amber-500" /> Tickets em Aberto</CardTitle><Button variant="ghost" size="sm" onClick={() => navigate("/super-admin/support")}>Atender <ArrowRight className="h-4 w-4" /></Button></CardHeader>
          <CardContent className="space-y-3">
            {openTickets.map(t => (
              <button key={t.id} onClick={() => navigate("/super-admin/support")} className="w-full p-3 rounded-lg border bg-background/50 hover:bg-amber-500/5 hover:border-amber-500/30 transition-all text-left">
                <div className="flex items-center justify-between mb-1"><p className="font-medium text-sm">{t.id} • {t.tenant}</p><Badge variant="outline" className={t.priority === "critical" ? "bg-destructive/10 text-destructive border-destructive/30" : t.priority === "high" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-muted"}>{t.priority}</Badge></div>
                <p className="text-xs text-muted-foreground">{t.subject}</p>
              </button>
            ))}
            {openTickets.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum ticket aberto neste momento.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminHome;
