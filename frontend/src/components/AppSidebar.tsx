import {
  LayoutDashboard, Calendar, Scissors, Users, UserCheck, Package, DollarSign,
  BarChart3, Wallet, Settings, LogOut, ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { hasTenantPermission, TenantPermission } from "@/lib/permissions";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: null },
  { title: "Agenda", url: "/dashboard/agenda", icon: Calendar, permission: "agenda" },
  { title: "Clientes", url: "/dashboard/clients", icon: Users, permission: "clients" },
  { title: "Funcionários", url: "/dashboard/employees", icon: UserCheck, permission: "employees" },
  { title: "Serviços", url: "/dashboard/services", icon: Scissors, permission: "services" },
];

const businessItems = [
  { title: "Financeiro", url: "/dashboard/financial", icon: BarChart3, permission: "financial" },
  { title: "Caixa", url: "/dashboard/cashier", icon: Wallet, permission: "cashier" },
  { title: "Comissões", url: "/dashboard/commissions", icon: DollarSign, permission: "commissions" },
  { title: "Estoque", url: "/dashboard/stock", icon: Package, permission: "stock" },
];

const systemItems = [
  { title: "Auditoria", url: "/dashboard/audit", icon: ShieldCheck, permission: "audit" },
  { title: "Configurações", url: "/dashboard/settings", icon: Settings, permission: "settings" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    setLogoutOpen(false);
    logout();
    toast.success("Sessão terminada com sucesso");
    navigate("/");
  };

  const renderGroup = (label: string, items: Array<{ title: string; url: string; icon: any; permission: TenantPermission | null }>) => {
    const visibleItems = items.filter((item) => hasTenantPermission(user, item.permission));
    if (visibleItems.length === 0) return null;

    return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/dashboard"}
                  className="hover:bg-sidebar-accent/50"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Scissors className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-serif font-bold text-sidebar-foreground text-lg">GenOmni Salon</span>}
        </div>
        {renderGroup("Principal", mainItems)}
        {renderGroup("Negócio", businessItems)}
        {renderGroup("Sistema", systemItems)}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setLogoutOpen(true)}>
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza de que deseja sair do sistema? Será redirecionado para a página inicial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
