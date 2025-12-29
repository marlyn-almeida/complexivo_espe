import axiosClient from "../api/axiosClient";
import type { Criterio } from "../types/criterio";

export type CriterioCreateDTO = {
  nombre_criterio: string;
  orden_criterio: number;
};

export const criterioService = {
  list: async (params?: { includeInactive?: boolean }): Promise<Criterio[]> => {
    const res = await axiosClient.get<Criterio[]>("/criterios", {
      params: params
        ? { includeInactive: params.includeInactive ? "true" : "false" }
        : undefined,
    });
    return res.data ?? [];
  },

  create: async (payload: CriterioCreateDTO): Promise<Criterio> => {
    const res = await axiosClient.post("/criterios", payload);
    return res.data;
  },
};
