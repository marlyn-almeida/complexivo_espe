// src/components/auth/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";

import { dashboardByRole, getActiveRole, getToken } from "../../utils/auth";
import type { RolId } from "../../utils/auth";

export default function ProtectedRoute({
  allowRoles,
  children,
}: {
  allowRoles: RolId[];
  children: React.ReactNode;
}) {
  const token = getToken();
  const role = getActiveRole();

  if (!token) return <Navigate to="/login" replace />;

  // si por alguna razón no hay rol guardado, manda al login
  if (!role) return <Navigate to="/login" replace />;

  // si el rol no tiene permiso para esta sección, mándalo a su dashboard
  if (!allowRoles.includes(role)) {
    return <Navigate to={dashboardByRole(role)} replace />;
  }

  return <>{children}</>;
}
