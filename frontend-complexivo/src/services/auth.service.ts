import axiosClient from "../api/axiosClient";

export type RoleItem = { id_rol: number; nombre_rol: string };

export type ChangeRoleResponse = {
  ok: boolean;
  accessToken: string;
  roles: RoleItem[];
  activeRole: RoleItem | null;
  redirectTo?: string;
};

export const authService = {
  changeActiveRole: async (activeRole: number): Promise<ChangeRoleResponse> => {
    const res = await axiosClient.post<ChangeRoleResponse>("/auth/active-role", { activeRole });
    return res.data;
  },
};
