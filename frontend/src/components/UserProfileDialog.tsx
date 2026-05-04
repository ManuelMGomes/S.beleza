import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Mail, Phone, Shield, Calendar, Building2, Pencil, Save, X, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export interface UserProfile {
  name: string;
  initials: string;
  email: string;
  phone: string;
  role: string;
  tenant?: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  onUpdate?: (profile: UserProfile) => void;
  onDelete?: () => void;
}

export function UserProfileDialog({ open, onOpenChange, profile, onUpdate, onDelete }: UserProfileDialogProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserProfile>(profile);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  const handleSave = () => {
    if (!form.name || !form.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    onUpdate?.(form);
    setEditing(false);
    toast.success("Perfil atualizado com sucesso");
  };

  const handleCancel = () => {
    setForm(profile);
    setEditing(false);
  };

  const handleChangePassword = () => {
    if (!pwd.current || !pwd.next || pwd.next !== pwd.confirm) {
      toast.error("Verifique os campos da nova palavra-passe");
      return;
    }
    if (pwd.next.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }
    setPwd({ current: "", next: "", confirm: "" });
    toast.success("Palavra-passe alterada com sucesso");
  };

  const handleDelete = () => {
    onDelete?.();
    onOpenChange(false);
    toast.success("Conta removida");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Meu Perfil</DialogTitle>
          <DialogDescription>Veja e gerencie as informações da sua conta.</DialogDescription>
        </DialogHeader>

        {/* Header card */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border">
          <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0">
            {form.initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-xl font-semibold truncate">{form.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{form.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" />{form.role}</Badge>
              {form.tenant && (
                <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{form.tenant}</Badge>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="info" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
          </TabsList>

          {/* INFO */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={form.name} disabled={!editing} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} disabled={!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.phone} disabled={!editing} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Input value={form.role} disabled />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}><X className="h-4 w-4 mr-1" />Cancelar</Button>
                  <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" />Guardar</Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}><Pencil className="h-4 w-4 mr-1" />Editar perfil</Button>
              )}
            </div>
          </TabsContent>

          {/* SECURITY */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2"><KeyRound className="h-4 w-4" />Alterar palavra-passe</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Atual</Label>
                  <Input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Nova</Label>
                  <Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar</Label>
                  <Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword}>Atualizar palavra-passe</Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-destructive">Zona de perigo</h4>
              <p className="text-sm text-muted-foreground">Remover a conta apaga permanentemente os seus dados de acesso.</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive"><Trash2 className="h-4 w-4 mr-1" />Eliminar conta</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar conta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é irreversível. Todos os seus dados de acesso serão removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Sim, eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          {/* ACTIVITY */}
          <TabsContent value="activity" className="space-y-3 mt-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Calendar className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Conta criada em</p>
                  <p className="text-xs text-muted-foreground">{form.createdAt}</p>
                </div>
              </div>
              {form.lastLogin && (
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Último acesso</p>
                    <p className="text-xs text-muted-foreground">{form.lastLogin}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Mail className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{form.email}</p>
                  <p className="text-xs text-muted-foreground">Email principal</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Phone className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{form.phone}</p>
                  <p className="text-xs text-muted-foreground">Contacto telefónico</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
