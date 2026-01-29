// src/utils/auth.ts
export const TOKEN_KEY = "accessToken";
export const ROLES_KEY = "roles";
export const ACTIVE_ROLE_KEY = "activeRole"; // guardaremos el OBJETO, no solo el id
export const SCOPE_KEY = "scope";
export const TEMP_TOKEN_KEY = "tempToken";

export type RolId = 1 | 2 | 3;

export type RoleLite = { id_rol: RolId; nombre_rol: string };
export type ScopeLite = { id_carrera?: number } | null;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** ✅ Guarda sesión completa (token + roles + activeRole + scope) */
export function setSession(data: {
  accessToken: string;
  roles?: Array<{ id_rol: number; nombre_rol: string }>;
  activeRole?: { id_rol: number; nombre_rol: string } | null;
  scope?: { id_carrera?: number } | null;
}) {
  localStorage.setItem(TOKEN_KEY, data.accessToken);

  localStorage.setItem(ROLES_KEY, JSON.stringify(data.roles ?? []));
  localStorage.setItem(ACTIVE_ROLE_KEY, JSON.stringify(data.activeRole ?? null));
  localStorage.setItem(SCOPE_KEY, JSON.stringify(data.scope ?? null));
}

/** ✅ Roles disponibles */
export function getRoles(): Array<{ id_rol: number; nombre_rol: string }> {
  const raw = localStorage.getItem(ROLES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** ✅ ActiveRole como objeto */
export function getActiveRoleObj(): { id_rol: RolId; nombre_rol: string } | null {
  const raw = localStorage.getItem(ACTIVE_ROLE_KEY);
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj) return null;
    const id = Number(obj.id_rol);
    if (id === 1 || id === 2 || id === 3) {
      return { id_rol: id as RolId, nombre_rol: String(obj.nombre_rol ?? "") };
    }
    return null;
  } catch {
    return null;
  }
}

/** ✅ ActiveRole solo id (para compatibilidad con lo que ya usas) */
export function getActiveRole(): RolId | null {
  const obj = getActiveRoleObj();
  return obj?.id_rol ?? null;
}

/** ✅ Scope (ej: { id_carrera }) */
export function getScope(): ScopeLite {
  const raw = localStorage.getItem(SCOPE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) ?? null;
  } catch {
    return null;
  }
}

/** ✅ Temp token para flujo mustChangePassword */
export function setTempToken(tempToken: string) {
  localStorage.setItem(TEMP_TOKEN_KEY, tempToken);
}

export function getTempToken(): string | null {
  return localStorage.getItem(TEMP_TOKEN_KEY);
}

export function clearTempToken() {
  localStorage.removeItem(TEMP_TOKEN_KEY);
}

/** ✅ Limpia TODO */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLES_KEY);
  localStorage.removeItem(ACTIVE_ROLE_KEY);
  localStorage.removeItem(SCOPE_KEY);
  localStorage.removeItem(TEMP_TOKEN_KEY);
}

/** (Opcional) por si aún quieres este helper */
export function dashboardByRole(role: RolId): string {
  if (role === 1) return "/superadmin/dashboard";
  if (role === 2) return "/admin/dashboard";
  return "/docente/dashboard";
}
