import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserProfileDialog, UserProfile } from "@/components/UserProfileDialog";
import { User, Settings, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { hasTenantPermission } from "@/lib/permissions";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    initials: "",
    email: "",
    phone: "",
    role: "Administradora",
    tenant: "",
    createdAt: "",
    lastLogin: "",
  });

  useEffect(() => {
    if (!user) return;
    const initials = user.full_name.split(" ").map((p: string) => p[0]).slice(0, 2).join("");
    const roleLabel =
      user.role === "admin"
        ? "Administrador"
        : user.role === "gerente"
          ? "Gerente"
          : user.role === "recepcionista"
            ? "Recepcionista"
            : user.role;
    setProfile((prev) => ({
      ...prev,
      name: user.full_name,
      initials,
      email: user.email,
      phone: user.phone || "",
      role: roleLabel,
      tenant: user.tenant_id || "",
      createdAt: prev.createdAt || "—",
      lastLogin: "Agora",
    }));
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4 shrink-0">
            <SidebarTrigger />
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm hover:bg-muted/60 rounded-md p-1 pr-2 transition-colors">
                  <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{profile.initials || "U"}</div>
                  <span className="hidden sm:inline text-foreground font-medium">{profile.name || "Utilizador"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{profile.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{profile.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileOpen(true)}><User className="h-4 w-4" /> Meu perfil</DropdownMenuItem>
                {hasTenantPermission(user, "settings") && (
                  <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}><Settings className="h-4 w-4" /> Configurações</DropdownMenuItem>
                )}
                {hasTenantPermission(user, "audit") && (
                  <DropdownMenuItem onClick={() => navigate("/dashboard/audit")}><ShieldCheck className="h-4 w-4" /> Auditoria</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate("/"); }} className="text-destructive"><LogOut className="h-4 w-4" /> Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} profile={profile} onUpdate={setProfile} />
    </SidebarProvider>
  );
};

export default DashboardLayout;
