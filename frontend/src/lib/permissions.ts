export type TenantPermission =
  | "agenda"
  | "clients"
  | "employees"
  | "services"
  | "financial"
  | "cashier"
  | "commissions"
  | "stock"
  | "audit"
  | "settings";

export const tenantRoutePermissions: Record<string, TenantPermission | null> = {
  "/dashboard": null,
  "/dashboard/agenda": "agenda",
  "/dashboard/clients": "clients",
  "/dashboard/employees": "employees",
  "/dashboard/services": "services",
  "/dashboard/financial": "financial",
  "/dashboard/cashier": "cashier",
  "/dashboard/commissions": "commissions",
  "/dashboard/stock": "stock",
  "/dashboard/audit": "audit",
  "/dashboard/settings": "settings",
};

const tenantFallbackOrder: string[] = [
  "/dashboard",
  "/dashboard/agenda",
  "/dashboard/clients",
  "/dashboard/cashier",
  "/dashboard/commissions",
  "/dashboard/employees",
  "/dashboard/services",
  "/dashboard/financial",
  "/dashboard/stock",
  "/dashboard/audit",
  "/dashboard/settings",
];

export function hasTenantPermission(user: any, permission?: TenantPermission | null) {
  if (!permission) return true;
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "admin") return true;
  return !!user.permissions?.[permission];
}

export function getFirstAllowedTenantRoute(user: any) {
  for (const route of tenantFallbackOrder) {
    if (hasTenantPermission(user, tenantRoutePermissions[route])) {
      return route;
    }
  }
  return "/dashboard";
}
