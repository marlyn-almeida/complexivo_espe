// src/services/carreraDocente.service.ts
import axiosClient from "../api/axiosClient";
import type { CarreraDocente } from "../types/carreraDocente";

export type CarreraDocenteListParams = {
  includeInactive?: boolean;
  docenteId?: number;
  carreraPeriodoId?: number;
};

export const carreraDocenteService = {
  list: async (params?: CarreraDocenteListParams): Promise<CarreraDocente[]> => {
    const res = await axiosClient.get<CarreraDocente[]>("/carrera-docente", {
      params: {
        includeInactive: params?.includeInactive ? 1 : 0,
        docenteId: params?.docenteId,
        carreraPeriodoId: params?.carreraPeriodoId,
      },
    });
    return res.data ?? [];
  },
};
