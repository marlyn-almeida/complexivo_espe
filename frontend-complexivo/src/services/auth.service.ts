// src/services/auth.service.ts
import axiosClient from "../api/axiosClient";

export type RoleLite = { id_rol: number };
export type ActiveRoleLite = { id_rol: number } | null;

export type LoginResponse =
  | { mustChangePassword: true; tempToken: string; __version?: string }
  | {
      mustChangePassword: false;
      mustChooseRole: boolean;
      accessToken: string;
      roles: RoleLite[];
      activeRole: ActiveRoleLite;
      scope?: { id_carrera?: number } | null;
      redirectTo: string;
      __version?: string;
    };

export async function login(user: string, password: string, activeRole: number = 1): Promise<LoginResponse> {
  const res = await axiosClient.post<LoginResponse>("/auth/login", {
    // ✅ compat: por si tu validator pide "username"
    username: user,
    // ✅ tu authService del back usa "nombre_usuario"
    nombre_usuario: user,
    password,
    // ✅ tu back lo usa y tu validador puede exigirlo
    activeRole,
  });

  return res.data;
}

export async function setActiveRole(activeRole: number) {
  const res = await axiosClient.post<{
    ok: true;
    accessToken: string;
    roles: RoleLite[];
    activeRole: ActiveRoleLite;
    scope?: { id_carrera?: number } | null;
    redirectTo: string;
    __version?: string;
  }>("/auth/active-role", { activeRole });

  return res.data;
}

export async function changePassword(tempToken: string, newPassword: string, confirmPassword: string) {
  const res = await axiosClient.patch<{
    accessToken: string;
    roles: RoleLite[];
    activeRole: ActiveRoleLite;
    scope?: { id_carrera?: number } | null;
    redirectTo: string;
    __version?: string;
  }>("/auth/change-password", { tempToken, newPassword, confirmPassword });

  return res.data;
}
