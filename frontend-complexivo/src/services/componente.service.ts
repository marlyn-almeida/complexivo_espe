import axiosClient from "../api/axiosClient";

export interface Componente {
  id_componente: number;
  nombre_componente: string;
  estado: number | boolean;
}

export const componenteService = {
  list: async (params?: { includeInactive?: boolean }): Promise<Componente[]> => {
    const res = await axiosClient.get<Componente[]>("/componentes", {
      params: params
        ? {
            includeInactive: params.includeInactive ? "true" : "false",
          }
        : undefined,
    });

    return res.data ?? [];
  },
};
