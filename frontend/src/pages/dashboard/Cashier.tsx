import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Lock, Unlock, Plus, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ExportButton from "@/components/ExportButton";
import CrudDialog from "@/components/CrudDialog";
import { toast } from "sonner";
import { formatKz } from "@/lib/format";
import { exportToCSV, exportToPDF } from "@/lib/exportReport";
import { api } from "@/lib/api";

const paymentMethods = [
  { value: "Multicaixa Express", label: "Multicaixa Express" },
  { value: "TPA", label: "TPA (Terminal de Pagamento)" },
  { value: "Transferência Bancária", label: "Transferência Bancária" },
  { value: "Dinheiro", label: "Dinheiro" },
];

const Cashier = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [movements, setMovements] = useState<any[]>([]);
  const [summary, setSummary] = useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ description: "", value: 0, type: "entrada", method: "Multicaixa Express" });

  const loadData = async () => {
    try {
      const [mvs, sum] = await Promise.all([api.cashier.movements(), api.cashier.summary()]);
      setMovements(mvs);
      setSummary(sum);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar caixa");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportData = useMemo(
    () =>
      movements.map((m) => ({
        time: new Date(m.created_at).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }),
        type: m.type,
        description: m.description,
        method: m.method,
        value: m.value,
      })),
    [movements]
  );

  const handleSave = async () => {
    try {
      await api.cashier.createMovement({ ...form, value: Number(form.value) });
      toast.success("Movimentação registrada!");
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar movimentação");
    }
  };

  const exportColumns = [
    { header: "Hora", key: "time" },
    { header: "Tipo", key: "type" },
    { header: "Descrição", key: "description" },
    { header: "Método", key: "method" },
    { header: "Valor", key: "value", format: "currency" as const },
  ];

  const exportSummary = [
    { label: "Entradas", value: formatKz(summary.entradas) },
    { label: "Saídas", value: formatKz(summary.saidas) },
    { label: "Saldo", value: formatKz(summary.saldo) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caixa"
        subtitle="Controle de abertura e fechamento"
        actions={
          <div className="flex gap-2">
            <ExportButton
              onExportCSV={() => exportToCSV({ title: "Relatório de Caixa - GenOmni Salon", subtitle: "Movimentações do dia", columns: exportColumns, data: exportData, summary: exportSummary, filename: "relatorio-caixa" })}
              onExportPDF={() => exportToPDF({ title: "Relatório de Caixa", subtitle: "Movimentações do dia", columns: exportColumns, data: exportData, summary: exportSummary, filename: "relatorio-caixa" })}
            />
            {isOpen && <Button onClick={() => { setForm({ description: "", value: 0, type: "entrada", method: "Multicaixa Express" }); setDialogOpen(true); }} variant="outline" className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Movimentação</Button>}
            <Button variant={isOpen ? "destructive" : "default"} onClick={() => { setIsOpen(!isOpen); toast.success(isOpen ? "Caixa fechado!" : "Caixa aberto!"); }}>
              {isOpen ? <><Lock className="mr-2 h-4 w-4" /> Fechar Caixa</> : <><Unlock className="mr-2 h-4 w-4" /> Abrir Caixa</>}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Entradas", value: summary.entradas, icon: ArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Saídas", value: summary.saidas, icon: ArrowDownRight, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Saldo Actual", value: summary.saldo, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
        ].map((item) => (
          <Card key={item.label} className="shadow-card overflow-hidden">
            <div className="h-1 gradient-primary" />
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>{formatKz(item.value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <CardTitle className="font-serif text-lg flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Movimentações</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors border border-border/30">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${m.type === "entrada" ? "bg-emerald-50" : "bg-destructive/10"}`}>
                    {m.type === "entrada" ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })} • {m.method}</p>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${m.type === "entrada" ? "text-emerald-600" : "text-destructive"}`}>
                  {m.type === "entrada" ? "+" : "-"}{formatKz(Math.abs(m.value))}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CrudDialog open={dialogOpen} onOpenChange={setDialogOpen} title="Nova Movimentação" onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Valor (Kz)</Label><Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} /></div>
          <div className="col-span-2 space-y-2">
            <Label>Método de Pagamento</Label>
            <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{paymentMethods.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </CrudDialog>
    </div>
  );
};

export default Cashier;
