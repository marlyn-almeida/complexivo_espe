// src/utils/auth.ts
export const TOKEN_KEY = "accessToken";
export const ROLES_KEY = "roles";
export const ACTIVE_ROLE_KEY = "activeRole";

export type RolId = 1 | 2 | 3;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(data: {
  accessToken: string;
  roles?: Array<{ id_rol: number; nombre_rol: string }>;
  activeRole?: { id_rol: number; nombre_rol: string };
}) {
  localStorage.setItem(TOKEN_KEY, data.accessToken);

  if (data.roles) {
    localStorage.setItem(ROLES_KEY, JSON.stringify(data.roles));
  }

  if (data.activeRole) {
    localStorage.setItem(ACTIVE_ROLE_KEY, String(data.activeRole.id_rol));
  }
}

export function getActiveRole(): RolId | null {
  const v = localStorage.getItem(ACTIVE_ROLE_KEY);
  if (!v) return null;
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3) return n;
  return null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLES_KEY);
  localStorage.removeItem(ACTIVE_ROLE_KEY);
}

export function dashboardByRole(role: RolId): string {
  if (role === 1) return "/superadmin/dashboard";
  if (role === 2) return "/admin/dashboard";
  return "/docente/dashboard";
}
