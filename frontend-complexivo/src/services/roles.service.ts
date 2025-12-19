import axiosClient from "../api/axiosClient";

export interface Role {
  id_rol: number;
  nombre_rol: string;
  descripcion_rol?: string | null;
  estado: number;
}

export const roleService = {
  list: async (): Promise<Role[]> => {
    const res = await axiosClient.get<Role[]>("/roles");
    return res.data ?? [];
  },

  create: async (payload: Pick<Role, "nombre_rol" | "descripcion_rol">) => {
    const res = await axiosClient.post("/roles", payload);
    return res.data;
  },

  update: async (id: number, payload: Partial<Role>) => {
    const res = await axiosClient.put(`/roles/${id}`, payload);
    return res.data;
  },

  setEstado: async (id: number, estado: 0 | 1) => {
    const res = await axiosClient.patch(`/roles/${id}/estado`, { estado });
    return res.data;
  },
};
