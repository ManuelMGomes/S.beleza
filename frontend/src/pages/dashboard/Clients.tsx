import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

const Clients = () => {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    serviceId: "",
    employeeId: "",
    appointmentDate: "",
    appointmentTime: "",
  });

  const load = async () => {
    try {
      const [cs, ss, es] = await Promise.all([api.clients.list(), api.services.list(), api.employees.list()]);
      setClients(cs);
      setServices(ss);
      setEmployees(es.filter((e: any) => e.type === "servico"));
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar clientes");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())), [clients, search]);

  const resetForm = () =>
    setForm({
      name: "",
      phone: "",
      email: "",
      notes: "",
      serviceId: "",
      employeeId: "",
      appointmentDate: new Date().toISOString().split("T")[0],
      appointmentTime: "09:00",
    });

  const openNew = () => {
    setEditingId(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      notes: c.notes || "",
      serviceId: "",
      employeeId: "",
      appointmentDate: "",
      appointmentTime: "",
    });
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setEditingId(id);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.clients.update(editingId, {
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          notes: form.notes,
          birth_date: null,
        });
        toast.success("Cliente atualizado!");
      } else {
        const newClient = await api.clients.create({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          notes: form.notes,
          birth_date: null,
        });

        if (form.serviceId && form.employeeId && form.appointmentDate && form.appointmentTime) {
          await api.appointments.create({
            client_id: newClient.id,
            service_id: form.serviceId,
            employee_id: form.employeeId,
            start_at: `${form.appointmentDate}T${form.appointmentTime}:00`,
            status: "pending",
            price: Number(services.find((s: any) => s.id === form.serviceId)?.price || 0),
          });
          toast.success("Cliente cadastrado e agendamento criado!");
        } else {
          toast.success("Cliente cadastrado!");
        }
      }

      setDialogOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cliente");
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await api.clients.delete(editingId);
      toast.success("Cliente removido!");
      setDeleteOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover cliente");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" subtitle="Gerencie sua base de clientes" actions={<Button onClick={openNew} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>} />

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Users className="h-4 w-4 text-primary" /> {filtered.length} clientes</div>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead className="hidden lg:table-cell">Última Visita</TableHead>
                <TableHead className="text-right">Visitas</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => (
                <TableRow key={c.id} className="group hover:bg-secondary/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">{c.name.split(" ").map((n: string) => n[0]).join("")}</div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{c.phone}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{c.email || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{c.last_visit ? new Date(c.last_visit).toLocaleDateString("pt-AO") : "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{c.total_visits || 0}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? "Editar Cliente" : "Cadastro & Marcação"} onSave={handleSave} saveLabel={editingId ? "Salvar" : "Cadastrar"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Telefone *</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label>E-mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2"><Label>Observações</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>

          {!editingId && (
            <>
              <div className="pt-2 border-t border-border/40"><Badge variant="outline">Agendamento opcional</Badge></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serviço</Label>
                  <Select value={form.serviceId} onValueChange={v => setForm(f => ({ ...f, serviceId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{services.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.appointmentDate} onChange={e => setForm(f => ({ ...f, appointmentDate: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Hora</Label><Input type="time" value={form.appointmentTime} onChange={e => setForm(f => ({ ...f, appointmentTime: e.target.value }))} /></div>
              </div>
            </>
          )}
        </div>
      </CrudDialog>

      <CrudDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Excluir Cliente" description="Tem certeza?" onSave={handleDelete} saveLabel="Excluir" variant="destructive">
        <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
      </CrudDialog>
    </div>
  );
};

export default Clients;
