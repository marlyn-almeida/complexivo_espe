import axiosClient from "../api/axiosClient";

export type RoleLite = { id_rol: number; nombre_rol: string };

export type LoginResponse =
  | { mustChangePassword: true; tempToken: string; __version?: string }
  | {
      mustChangePassword: false;
      mustChooseRole?: boolean;
      accessToken: string;
      roles: RoleLite[];
      activeRole: RoleLite | null;
      scope?: { id_carrera?: number } | null;
      redirectTo: string;
      __version?: string;
    };

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await axiosClient.post<LoginResponse>("/auth/login", {
    username,
    password,
  });
  return res.data;
}

export async function setActiveRole(activeRole: number) {
  const res = await axiosClient.post<{
    ok: boolean;
    accessToken: string;
    roles: RoleLite[];
    activeRole: RoleLite | null;
    scope?: { id_carrera?: number } | null;
    redirectTo: string;
  }>("/auth/active-role", { activeRole });

  return res.data;
}
