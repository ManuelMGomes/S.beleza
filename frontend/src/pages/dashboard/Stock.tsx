import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, AlertTriangle, Package, Bell } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import CrudDialog from "@/components/CrudDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatKz } from "@/lib/format";

const Stock = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "", price: 0, stock: 0, min_stock: 0 });

  const load = async () => {
    try {
      const data = await api.products.list();
      setProducts(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar stock");
    }
  };

  useEffect(() => { load(); }, []);

  const lowStock = products.filter((p) => p.stock <= p.min_stock);

  useEffect(() => {
    if (lowStock.length > 0) {
      toast.warning(`⚠️ ${lowStock.length} produto(s) com estoque baixo! Verifique a lista.`, { duration: 5000, icon: <Bell className="h-4 w-4" /> });
    }
  }, [products.length]);

  const openNew = () => { setEditingId(null); setForm({ name: "", category: "", price: 0, stock: 0, min_stock: 0 }); setDialogOpen(true); };
  const openEdit = (p: any) => { setEditingId(p.id); setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, min_stock: p.min_stock }); setDialogOpen(true); };
  const openDelete = (id: string) => { setEditingId(id); setDeleteOpen(true); };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.products.update(editingId, { ...form, active: true });
        toast.success("Produto atualizado!");
      } else {
        await api.products.create({ ...form, active: true });
        toast.success("Produto cadastrado!");
      }
      setDialogOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar produto");
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await api.products.delete(editingId);
      toast.success("Produto removido!");
      setDeleteOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover produto");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque" subtitle="Controle de produtos e materiais" actions={<Button onClick={openNew} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Produto</Button>} />

      {lowStock.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Estoque Baixo — {lowStock.length} produto(s)</p>
              <p className="text-xs text-amber-700 mt-0.5">{lowStock.map((p) => p.name).join(", ")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Package className="h-4 w-4 text-primary" /> {products.length} produtos</div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className="group hover:bg-secondary/40 transition-colors">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.category}</TableCell>
                  <TableCell className="text-right font-semibold">{formatKz(p.price)}</TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell>{p.stock <= p.min_stock ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Baixo</Badge> : <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">OK</Badge>}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingId ? "Editar Produto" : "Novo Produto"} onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Preço (Kz)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label>Estoque Actual</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))} /></div>
        </div>
      </CrudDialog>

      <CrudDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Excluir Produto" description="Tem certeza?" onSave={handleDelete} saveLabel="Excluir" variant="destructive">
        <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
      </CrudDialog>
    </div>
  );
};

export default Stock;
