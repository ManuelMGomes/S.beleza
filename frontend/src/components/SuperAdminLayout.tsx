import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/SuperAdminSidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Search, AlertTriangle, LifeBuoy, Building2, Crown, Settings, LogOut, Activity, User } from "lucide-react";
import { UserProfileDialog, UserProfile } from "@/components/UserProfileDialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [globalSearch, setGlobalSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "Super Admin",
    initials: "SA",
    email: "",
    phone: "",
    role: "Super Admin",
    createdAt: "",
    lastLogin: "Agora",
  });
  const [tenants, setTenants] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.full_name,
        initials: user.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join(""),
        email: user.email,
        phone: user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    Promise.all([api.superAdmin.tenants(), api.superAdmin.tickets()])
      .then(([ts, tk]) => {
        setTenants(ts);
        setTickets(tk);
      })
      .catch(() => {
        // ignore silent here
      });
  }, []);

  const criticalAlerts = tenants.filter((t) => t.status === "suspended" || t.status === "expired");
  const openTickets = tickets.filter((t) => t.status !== "resolved");
  const notifCount = criticalAlerts.length + openTickets.length;

  const searchResults = globalSearch.trim()
    ? tenants.filter((t) =>
        t.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        t.nif.includes(globalSearch) ||
        t.owner.toLowerCase().includes(globalSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SuperAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card/80 backdrop-blur-sm px-4 gap-3 shrink-0 sticky top-0 z-30">
            <SidebarTrigger />
            <Badge variant="outline" className="border-accent/40 bg-accent/10 hidden sm:inline-flex"><Crown className="h-3 w-3 mr-1 text-accent" /><span className="text-accent font-semibold">Super Admin</span></Badge>

            <div className="flex-1 max-w-md relative">
              <Popover open={searchResults.length > 0}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Procurar empresa, NIF, responsável..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="pl-9 h-9 bg-background/60" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                  {searchResults.map((t) => (
                    <button key={t.id} onClick={() => { navigate("/super-admin/tenants"); setGlobalSearch(""); }} className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent/10 text-left text-sm">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1"><p className="font-medium truncate">{t.name}</p><p className="text-xs text-muted-foreground truncate">{t.nif} • {t.owner}</p></div>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {notifCount > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">{notifCount}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b flex items-center justify-between"><p className="font-semibold text-sm">Notificações</p><Badge variant="outline" className="text-[10px]">{notifCount} novas</Badge></div>
                <div className="max-h-80 overflow-y-auto">
                  {criticalAlerts.map((t) => (
                    <button key={`alert-${t.id}`} onClick={() => navigate("/super-admin/tenants")} className="w-full flex items-start gap-2 p-3 hover:bg-muted/40 border-b text-left">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1"><p className="text-xs font-medium">Empresa {t.status === "suspended" ? "suspensa" : "expirada"}</p><p className="text-xs text-muted-foreground truncate">{t.name}</p></div>
                    </button>
                  ))}
                  {openTickets.slice(0, 5).map((t) => (
                    <button key={`tk-${t.id}`} onClick={() => navigate("/super-admin/support")} className="w-full flex items-start gap-2 p-3 hover:bg-muted/40 border-b text-left">
                      <LifeBuoy className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1"><p className="text-xs font-medium">Ticket {t.id} • {t.priority}</p><p className="text-xs text-muted-foreground truncate">{t.subject}</p></div>
                    </button>
                  ))}
                  {notifCount === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Tudo em ordem</p>}
                </div>
              </PopoverContent>
            </Popover>

            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
              <span className="text-xs font-medium text-emerald-600">Sistemas OK</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-muted/50 rounded-md p-1 pr-2 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{profile.initials || "SA"}</div>
                  <span className="hidden sm:inline text-sm font-medium">{profile.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel><div className="flex flex-col"><span className="font-medium">{profile.name}</span><span className="text-xs text-muted-foreground font-normal">{profile.email}</span></div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileOpen(true)}><User className="h-4 w-4" /> Meu perfil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Auditoria de acessos abrirá em breve")}><Activity className="h-4 w-4" /> Auditoria de acessos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("Configurações da plataforma")}><Settings className="h-4 w-4" /> Configurações</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate("/"); }} className="text-destructive"><LogOut className="h-4 w-4" /> Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto"><Outlet /></main>
        </div>
      </div>

      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} profile={profile} onUpdate={setProfile} />
    </SidebarProvider>
  );
};

export default SuperAdminLayout;
