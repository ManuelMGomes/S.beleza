import { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getFirstAllowedTenantRoute, hasTenantPermission, TenantPermission } from "@/lib/permissions";

type ProtectedRole = "tenant" | "super_admin";

const ProtectedRoute = ({
  children,
  role,
  permission,
}: {
  children: ReactElement;
  role?: ProtectedRole;
  permission?: TenantPermission | null;
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === "super_admin" && user.role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === "tenant" && user.role === "super_admin") {
    return <Navigate to="/super-admin" replace />;
  }

  if (role === "tenant" && !hasTenantPermission(user, permission)) {
    return <Navigate to={getFirstAllowedTenantRoute(user)} replace />;
  }

  return children;
};

export default ProtectedRoute;
