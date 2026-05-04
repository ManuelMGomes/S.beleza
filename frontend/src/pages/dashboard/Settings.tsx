import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Clock, Shield, Headphones, Mail, Phone, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { api } from "@/lib/api";

const permissionModules = [
  { key: "agenda", label: "Agenda" },
  { key: "clients", label: "Clientes" },
  { key: "employees", label: "Funcionários" },
  { key: "services", label: "Serviços" },
  { key: "financial", label: "Financeiro" },
  { key: "cashier", label: "Caixa" },
  { key: "commissions", label: "Comissões" },
  { key: "stock", label: "Estoque" },
  { key: "audit", label: "Auditoria" },
  { key: "settings", label: "Configurações" },
];

const emptyCompany = { name: "", nif: "", phone: "", email: "", address: "", city: "Luanda" };
const emptyHours = { open: "", close: "" };
const emptyRoles = { gerente: {}, recepcionista: {}, profissional: {} };

const SettingsPage = () => {
  const [company, setCompany] = useState<any>(emptyCompany);
  const [hours, setHours] = useState(emptyHours);
  const [roles, setRoles] = useState<any>(emptyRoles);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: "", message: "", priority: "normal" });

  const load = async () => {
    try {
      const data = await api.settings.get();
      setCompany(data.company || emptyCompany);
      setHours(data.hours || emptyHours);
      setRoles(data.roles || emptyRoles);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async (message: string) => {
    setSaving(true);
    try {
      const data = await api.settings.update({ company, hours, roles });
      setCompany(data.company || emptyCompany);
      setHours(data.hours || emptyHours);
      setRoles(data.roles || emptyRoles);
      toast.success(message);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (role: "gerente" | "recepcionista" | "profissional", module: string) => {
    setRoles((prev: any) => ({
      ...prev,
      [role]: { ...prev[role], [module]: !prev[role]?.[module] },
    }));
  };

  const handleSupportSubmit = async () => {
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      toast.error("Preencha o assunto e a mensagem do suporte");
      return;
    }

    setSupportSending(true);
    try {
      await api.settings.createSupportTicket(supportForm);
      toast.success("Pedido de suporte enviado com sucesso");
      setSupportForm({ subject: "", message: "", priority: "normal" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar pedido de suporte");
    } finally {
      setSupportSending(false);
    }
  };

  const roleMeta = {
    gerente: { label: "Gerente", badge: "bg-purple-50 text-purple-700 border-purple-200" },
    recepcionista: { label: "Recepcionista", badge: "bg-blue-50 text-blue-700 border-blue-200" },
    profissional: { label: "Profissional", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  } as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Gerencie a sua empresa e sistema" />

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" /> Permissões
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2">
            <Headphones className="h-4 w-4" /> Suporte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card className="overflow-hidden shadow-card">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <Building2 className="h-4 w-4 text-primary" /> Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome do Salão</Label>
                  <Input value={company.name} onChange={(e) => setCompany((c: any) => ({ ...c, name: e.target.value }))} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>NIF</Label>
                  <Input value={company.nif} onChange={(e) => setCompany((c: any) => ({ ...c, nif: e.target.value }))} placeholder="000000000LA000" disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={company.phone} onChange={(e) => setCompany((c: any) => ({ ...c, phone: e.target.value }))} placeholder="+244 9XX XXX XXX" disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={company.email} onChange={(e) => setCompany((c: any) => ({ ...c, email: e.target.value }))} disabled={loading} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={company.address} onChange={(e) => setCompany((c: any) => ({ ...c, address: e.target.value }))} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={company.city} onChange={(e) => setCompany((c: any) => ({ ...c, city: e.target.value }))} disabled={loading} />
                </div>
              </div>
              <Button onClick={() => saveSettings("Dados da empresa salvos")} className="shadow-sm" disabled={saving || loading}>
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-card">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <Clock className="h-4 w-4 text-primary" /> Horário de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Abertura</Label>
                  <Input type="time" value={hours.open} onChange={(e) => setHours((h) => ({ ...h, open: e.target.value }))} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label>Fechamento</Label>
                  <Input type="time" value={hours.close} onChange={(e) => setHours((h) => ({ ...h, close: e.target.value }))} disabled={loading} />
                </div>
              </div>
              <Button onClick={() => saveSettings("Horário salvo")} className="shadow-sm" disabled={saving || loading}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          {(["gerente", "recepcionista", "profissional"] as const).map((role) => (
            <Card key={role} className="overflow-hidden shadow-card">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <Shield className="h-4 w-4 text-primary" />
                    {roleMeta[role].label}
                  </CardTitle>
                  <Badge variant="outline" className={roleMeta[role].badge}>
                    {Object.values(roles[role] || {}).filter(Boolean).length}/{permissionModules.length} módulos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {permissionModules.map((mod) => (
                    <div key={mod.key} className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-3">
                      <span className="text-sm font-medium">{mod.label}</span>
                      <Switch checked={!!roles[role]?.[mod.key]} onCheckedChange={() => togglePermission(role, mod.key)} />
                    </div>
                  ))}
                </div>
                <Button className="mt-4 shadow-sm" onClick={() => saveSettings(`Permissões de ${roleMeta[role].label} salvas`)} disabled={saving || loading}>
                  {saving ? "Salvando..." : "Salvar Permissões"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card className="overflow-hidden shadow-card">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <Headphones className="h-4 w-4 text-primary" /> Contactar Suporte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input value={supportForm.subject} onChange={(e) => setSupportForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Descreva brevemente o problema" />
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={supportForm.priority} onValueChange={(v) => setSupportForm((f) => ({ ...f, priority: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea value={supportForm.message} onChange={(e) => setSupportForm((f) => ({ ...f, message: e.target.value }))} placeholder="Descreva o problema ou a sua solicitação em detalhe..." rows={5} />
              </div>
              <Button onClick={handleSupportSubmit} className="shadow-sm" disabled={supportSending}>
                <Send className="mr-2 h-4 w-4" /> {supportSending ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-card">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <Phone className="h-4 w-4 text-primary" /> Canais de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { icon: Mail, label: "E-mail", value: "suporte@genomni.ao" },
                  { icon: Phone, label: "Telefone", value: "+244 222 000 000" },
                  { icon: Headphones, label: "WhatsApp", value: "+244 923 000 000" },
                ].map((channel) => (
                  <div key={channel.label} className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/40 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <channel.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{channel.label}</p>
                      <p className="text-sm font-medium text-foreground">{channel.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
