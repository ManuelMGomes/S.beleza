import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Eye, Power, PowerOff, Building2, Mail, Phone, MapPin, Calendar, Users, CreditCard, Download, MoreHorizontal, Send, Copy, FileText } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatKz } from "@/lib/format";

const statusVariant: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  trial: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  suspended: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  expired: "bg-destructive/10 text-destructive border-destructive/30",
};
const statusLabel: Record<string, string> = { active: "Ativa", trial: "Trial", suspended: "Suspensa", expired: "Expirada" };

const Tenants = () => {
  const [searchParams] = useSearchParams();
  const [tenants, setTenants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const fromUrl = searchParams.get("status");
    return fromUrl && ["active", "trial", "suspended", "expired"].includes(fromUrl) ? fromUrl : "all";
  });
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ tenant: any; action: "suspend" | "activate" } | null>(null);

  const load = async () => {
    try {
      const data = await api.superAdmin.tenants();
      setTenants(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar empresas");
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("status");
    if (fromUrl && ["active", "trial", "suspended", "expired"].includes(fromUrl)) {
      setStatusFilter(fromUrl);
    }
  }, [searchParams]);

  const filtered = useMemo(() => tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.nif.includes(search) || t.owner.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPlan = planFilter === "all" || t.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  }), [tenants, search, statusFilter, planFilter]);

  const handleEmail = (t: any) => toast.success(`Email enviado para ${t.email}`);
  const handleCopy = (t: any) => { navigator.clipboard.writeText(`${t.name} • ${t.nif} • ${t.email}`); toast.success("Dados copiados"); };
  const handleExportCSV = () => {
    const headers = ["ID", "Nome", "NIF", "Responsável", "Email", "Cidade", "Plano", "Estado", "Utilizadores", "Receita Mensal"];
    const rows = filtered.map(t => [t.id, t.name, t.nif, t.owner, t.email, t.city, t.plan, t.status, t.users, t.monthly_revenue].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "empresas.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} empresas exportadas`);
  };

  const handleToggle = async () => {
    if (!confirmAction) return;
    const newStatus = confirmAction.action === "suspend" ? "suspended" : "active";
    try {
      await api.superAdmin.updateTenantStatus(confirmAction.tenant.id, newStatus);
      toast.success(confirmAction.action === "suspend" ? "Empresa suspensa" : "Empresa reativada");
      setConfirmAction(null);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar estado");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Empresas Cadastradas" subtitle="Gerencie todos os tenants da plataforma GenOmni Salon" />

      <Card className="shadow-card">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Procurar por nome, NIF ou responsável..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="trial">Em Trial</SelectItem>
              <SelectItem value="suspended">Suspensas</SelectItem>
              <SelectItem value="expired">Expiradas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Plano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="Essencial">Essencial</SelectItem>
              <SelectItem value="Profissional">Profissional</SelectItem>
              <SelectItem value="Premium">Premium</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV} className="shrink-0"><Download className="h-4 w-4" /> Exportar CSV</Button>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground px-1">A mostrar <span className="font-semibold text-foreground">{filtered.length}</span> de {tenants.length} empresas</div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>NIF</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Utilizadores</TableHead>
                  <TableHead>Receita / mês</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell><div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.owner} • {t.city}</p></div></TableCell>
                    <TableCell className="font-mono text-xs">{t.nif}</TableCell>
                    <TableCell><Badge variant="secondary">{t.plan}</Badge></TableCell>
                    <TableCell>{t.users}</TableCell>
                    <TableCell className="font-medium">{formatKz(t.monthly_revenue)}</TableCell>
                    <TableCell><Badge variant="outline" className={statusVariant[t.status]}>{statusLabel[t.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setSelected(t)} title="Ver detalhes"><Eye className="h-4 w-4" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" title="Mais ações"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => handleEmail(t)}><Send className="h-4 w-4" /> Enviar email</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopy(t)}><Copy className="h-4 w-4" /> Copiar dados</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success(`Fatura gerada para ${t.name}`)}><FileText className="h-4 w-4" /> Gerar fatura</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {t.status === "active" || t.status === "trial"
                              ? <DropdownMenuItem onClick={() => setConfirmAction({ tenant: t, action: "suspend" })} className="text-amber-600"><PowerOff className="h-4 w-4" /> Suspender acesso</DropdownMenuItem>
                              : <DropdownMenuItem onClick={() => setConfirmAction({ tenant: t, action: "activate" })} className="text-emerald-600"><Power className="h-4 w-4" /> Reativar acesso</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma empresa encontrada</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{selected?.name}</DialogTitle>
            <DialogDescription>Detalhes completos do tenant</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <InfoRow icon={Building2} label="NIF" value={selected.nif} />
              <InfoRow icon={Users} label="Responsável" value={selected.owner} />
              <InfoRow icon={Mail} label="Email" value={selected.email} />
              <InfoRow icon={Phone} label="Telefone" value={selected.phone} />
              <InfoRow icon={MapPin} label="Cidade" value={selected.city} />
              <InfoRow icon={CreditCard} label="Plano" value={selected.plan} />
              <InfoRow icon={Calendar} label="Cadastro" value={new Date(selected.created_at).toLocaleDateString("pt-AO")} />
              <InfoRow icon={Calendar} label="Próx. cobrança" value={new Date(selected.next_billing).toLocaleDateString("pt-AO")} />
              <div className="sm:col-span-2 grid grid-cols-3 gap-3 pt-3 border-t">
                <Stat label="Utilizadores" value={String(selected.users)} />
                <Stat label="Receita mensal" value={formatKz(selected.monthly_revenue)} />
                <Stat label="Último acesso" value={new Date(selected.last_access).toLocaleDateString("pt-AO")} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.action === "suspend" ? "Suspender empresa?" : "Reativar empresa?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "suspend"
                ? `A empresa "${confirmAction?.tenant.name}" perderá acesso ao sistema imediatamente.`
                : `A empresa "${confirmAction?.tenant.name}" voltará a ter acesso completo ao sistema.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} className={confirmAction?.action === "suspend" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-primary" /></div>
    <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium truncate">{value || "—"}</p></div>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center p-3 rounded-lg bg-muted/40"><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-bold mt-1">{value}</p></div>
);

export default Tenants;
