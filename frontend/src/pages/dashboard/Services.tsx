import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Clock, DollarSign } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import { toast } from "sonner";
import { formatKz } from "@/lib/format";
import { api } from "@/lib/api";

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: 0, duration: 0, commission: 0, category: "" });

  const load = async () => {
    try {
      const data = await api.services.list();
      setServices(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar serviços");
    }
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => [...new Set(services.map((s) => s.category))], [services]);

  const openNew = () => { setEditingId(null); setForm({ name: "", price: 0, duration: 0, commission: 0, category: "" }); setDialogOpen(true); };
  const openEdit = (s: any) => { setEditingId(s.id); setForm({ name: s.name, price: s.price, duration: s.duration, commission: s.commission, category: s.category }); setDialogOpen(true); };
  const openDelete = (id: string) => { setEditingId(id); setDeleteOpen(true); };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.services.update(editingId, { ...form, active: true });
        toast.success("Serviço atualizado!");
      } else {
        await api.services.create({ ...form, active: true });
        toast.success("Serviço cadastrado!");
      }
      setDialogOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar serviço");
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await api.services.delete(editingId);
      toast.success("Serviço removido!");
      setDeleteOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover serviço");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Serviços" subtitle="Gerencie os serviços oferecidos" actions={<Button onClick={openNew} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Serviço</Button>} />

      {categories.map((cat) => (
        <div key={cat} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1 w-6 rounded-full gradient-primary" />
            <h2 className="text-lg font-serif font-semibold text-foreground">{cat}</h2>
            <Badge variant="secondary" className="text-[10px]">{services.filter(s => s.category === cat).length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.filter((s) => s.category === cat).map((s) => (
              <Card key={s.id} className="group shadow-card hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-1 gradient-primary" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{s.name}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm"><DollarSign className="h-3.5 w-3.5 text-primary" /><span className="font-bold text-foreground text-lg">{formatKz(s.price)}</span></div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.duration} min</span>
                        <span>Comissão: {s.commission}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? "Editar Serviço" : "Novo Serviço"} onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Preço (Kz)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label>Duração (min)</Label><Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: Number(e.target.value) }))} /></div>
        </div>
      </CrudDialog>

      <CrudDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Excluir Serviço" description="Tem certeza?" onSave={handleDelete} saveLabel="Excluir" variant="destructive">
        <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
      </CrudDialog>
    </div>
  );
};

export default Services;
