import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ChevronLeft, ChevronRight, Edit, Trash2, Clock, Bell, CalendarDays, CalendarRange, LayoutGrid } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
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
const hours = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ client_id: "", service_id: "", employee_id: "", date: "", time: "09:00", status: "pending", price: 0 });

  const load = async () => {
    try {
      const [as, cs, ss, es] = await Promise.all([api.appointments.list(), api.clients.list(), api.services.list(), api.employees.list()]);
      setAppointments(as);
      setClients(cs);
      setServices(ss);
      setEmployees(es.filter((e: any) => e.type === "servico"));
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar agenda");
    }
  };

  useEffect(() => { load(); }, []);

  const baseDate = new Date(selectedDate + "T12:00:00");
  const toIso = (d: Date) => d.toISOString().split("T")[0];
  const weekStart = (() => { const d = new Date(baseDate); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d; })();
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const monthGridStart = (() => { const d = new Date(monthStart); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d; })();
  const monthDays = Array.from({ length: 42 }, (_, i) => { const d = new Date(monthGridStart); d.setDate(d.getDate() + i); return d; });
  const weekdayLabels = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

  const shift = (delta: number) => {
    const d = new Date(baseDate);
    if (view === "day") d.setDate(d.getDate() + delta);
    else if (view === "week") d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setSelectedDate(toIso(d));
  };

  const headerLabel = view === "day"
    ? baseDate.toLocaleDateString("pt-AO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : view === "week"
      ? `${weekDays[0].toLocaleDateString("pt-AO", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("pt-AO", { day: "numeric", month: "short", year: "numeric" })}`
      : baseDate.toLocaleDateString("pt-AO", { month: "long", year: "numeric" });

  const dayAppointments = useMemo(() => appointments.filter((a) => a.date === selectedDate), [appointments, selectedDate]);

  useEffect(() => {
    const upcoming = dayAppointments.filter(a => a.status === "confirmed" || a.status === "pending");
    if (upcoming.length > 0) {
      toast.info(`${upcoming.length} agendamento(s) hoje — próximo às ${upcoming.sort((a, b) => a.time.localeCompare(b.time))[0]?.time}`, { icon: <Bell className="h-4 w-4" />, duration: 3500 });
    }
  }, [selectedDate]);

  const openNew = () => { setEditingId(null); setForm({ client_id: "", service_id: "", employee_id: "", date: selectedDate, time: "09:00", status: "pending", price: 0 }); setDialogOpen(true); };
  const openEdit = (a: any) => { setEditingId(a.id); setForm({ client_id: a.client_id, service_id: a.service_id, employee_id: a.employee_id, date: a.date, time: a.time, status: a.status, price: a.price }); setDialogOpen(true); };
  const openDelete = (id: string) => { setEditingId(id); setDeleteOpen(true); };

  const handleSave = async () => {
    try {
      const payload = {
        client_id: form.client_id,
        service_id: form.service_id,
        employee_id: form.employee_id,
        start_at: `${form.date}T${form.time}:00`,
        status: form.status,
        price: Number(form.price),
      };

      if (editingId) {
        await api.appointments.update(editingId, payload);
        toast.success("Agendamento atualizado!");
      } else {
        await api.appointments.create(payload);
        toast.success("Agendamento criado!");
      }
      setDialogOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar agendamento");
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await api.appointments.delete(editingId);
      toast.success("Agendamento removido!");
      setDeleteOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover agendamento");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda" subtitle="Gerencie os agendamentos do salão" actions={<Button onClick={openNew} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Agendamento</Button>} />

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2 capitalize"><Clock className="h-4 w-4 text-primary" />{headerLabel}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="h-9">
                <TabsTrigger value="day" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Dia</TabsTrigger>
                <TabsTrigger value="week" className="gap-1.5"><CalendarRange className="h-3.5 w-3.5" />Semana</TabsTrigger>
                <TabsTrigger value="month" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" />Mês</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8" onClick={() => setSelectedDate(toIso(new Date()))}>Hoje</Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {view === "day" && (
            <div className="space-y-0.5">
              {hours.map((hour) => {
                const apt = dayAppointments.filter((a) => a.time === hour);
                return (
                  <div key={hour} className="flex gap-4 py-3 border-b border-border/30 last:border-0">
                    <span className="text-xs font-medium text-muted-foreground w-12 shrink-0 pt-1 tabular-nums">{hour}</span>
                    <div className="flex-1 space-y-2">
                      {apt.length > 0 ? apt.map((a) => (
                        <div key={a.id} className="group flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/25 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">{a.client.split(" ").map((n: string) => n[0]).join("")}</div>
                            <div><p className="font-medium text-foreground text-sm">{a.client}</p><p className="text-xs text-muted-foreground">{a.service} • {a.employee}</p></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{formatKz(a.price)}</span>
                            <Badge variant="outline" className={`text-[10px] px-2 ${statusColors[a.status]}`}>{statusLabels[a.status]}</Badge>
                            <div className="hidden group-hover:flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      )) : <div className="h-8 flex items-center"><span className="text-xs text-muted-foreground/40">—</span></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "week" && (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-[60px_repeat(7,minmax(120px,1fr))] gap-px bg-border/40 rounded-lg overflow-hidden border border-border/40 min-w-[820px]">
                <div className="bg-card p-2" />
                {weekDays.map((d) => {
                  const dayKey = toIso(d);
                  return (
                    <button key={dayKey} onClick={() => { setSelectedDate(dayKey); setView("day"); }} className={`bg-card p-2 text-center hover:bg-primary/5 transition-colors ${dayKey === selectedDate ? "bg-primary/10" : ""}`}>
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{weekdayLabels[(d.getDay() + 6) % 7]}</p>
                      <p className="text-sm font-semibold">{d.getDate()}</p>
                    </button>
                  );
                })}

                {hours.map((hour) => (
                  <>
                    <div key={`h-${hour}`} className="bg-card p-2 text-[10px] text-muted-foreground tabular-nums text-right">{hour}</div>
                    {weekDays.map((d) => {
                      const dayKey = toIso(d);
                      const apt = appointments.filter(a => a.date === dayKey && a.time === hour);
                      return (
                        <div key={`${dayKey}-${hour}`} className="bg-card p-1 min-h-[44px] space-y-1">
                          {apt.map(a => (
                            <button key={a.id} onClick={() => openEdit(a)} className={`w-full text-left rounded-md px-1.5 py-1 border text-[10px] leading-tight ${statusColors[a.status]} hover:opacity-90`}>
                              <p className="font-semibold truncate">{a.client}</p>
                              <p className="truncate opacity-75">{a.service}</p>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          )}

          {view === "month" && (
            <div>
              <div className="grid grid-cols-7 gap-px mb-1">{weekdayLabels.map(l => <div key={l} className="text-[10px] uppercase tracking-wider text-muted-foreground text-center py-1">{l}</div>)}</div>
              <div className="grid grid-cols-7 gap-px bg-border/40 rounded-lg overflow-hidden border border-border/40">
                {monthDays.map((d) => {
                  const dayKey = toIso(d);
                  const inMonth = d.getMonth() === baseDate.getMonth();
                  const apt = appointments.filter(a => a.date === dayKey);
                  return (
                    <button key={dayKey} onClick={() => { setSelectedDate(dayKey); setView("day"); }} className={`bg-card min-h-[88px] p-1.5 text-left hover:bg-primary/5 transition-colors flex flex-col gap-1 ${!inMonth ? "opacity-40" : ""} ${dayKey === selectedDate ? "ring-2 ring-primary ring-inset" : ""}`}>
                      <span className="text-xs font-semibold tabular-nums self-end">{d.getDate()}</span>
                      <div className="space-y-0.5 flex-1 overflow-hidden">
                        {apt.slice(0, 3).map(a => <div key={a.id} className={`truncate rounded px-1 py-0.5 border text-[9px] ${statusColors[a.status]}`}>{a.time} {a.client}</div>)}
                        {apt.length > 3 && <div className="text-[9px] text-muted-foreground">+{apt.length - 3} mais</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? "Editar Agendamento" : "Novo Agendamento"} onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select value={form.service_id} onValueChange={v => { const s = services.find(x => x.id === v); setForm(f => ({ ...f, service_id: v, price: s?.price || 0 })); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Horário</Label>
            <Select value={form.time} onValueChange={v => setForm(f => ({ ...f, time: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Preço (Kz)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
        </div>
      </CrudDialog>

      <CrudDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Excluir Agendamento" description="Tem certeza que deseja excluir este agendamento?" onSave={handleDelete} saveLabel="Excluir" variant="destructive">
        <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
      </CrudDialog>
    </div>
  );
};

export default Agenda;
