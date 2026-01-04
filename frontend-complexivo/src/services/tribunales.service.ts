// src/services/tribunales.service.ts
import axiosClient from "../api/axiosClient";
import type { Tribunal, Estado01 } from "../types/tribunal";
import type { TribunalDocenteDTO } from "../types/tribunalDocente";

export type TribunalListParams = {
  carreraPeriodoId?: number;
  includeInactive?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};

export type TribunalCreateDTO = {
  id_carrera_periodo: number;
  nombre_tribunal: string;
  caso?: number | null;

  // ✅ docentes en la misma creación (como dijiste)
  docentes: TribunalDocenteDTO[];
};

export type TribunalUpdateDTO = TribunalCreateDTO;

export const tribunalesService = {
  list: async (params?: TribunalListParams): Promise<Tribunal[]> => {
    const limit = Math.min(params?.limit ?? 100, 100);

    const res = await axiosClient.get<Tribunal[]>("/tribunales", {
      params: {
        carreraPeriodoId: params?.carreraPeriodoId,
        includeInactive: params?.includeInactive ? 1 : 0,
        q: params?.q?.trim() || undefined,
        page: params?.page ?? 1,
        limit,
      },
    });

    return res.data ?? [];
  },

  get: async (id: number): Promise<Tribunal> => {
    const res = await axiosClient.get<Tribunal>(`/tribunales/${id}`);
    return res.data;
  },

  create: async (payload: TribunalCreateDTO) => {
    const res = await axiosClient.post("/tribunales", payload);
    return res.data;
  },

  update: async (id: number, payload: TribunalUpdateDTO) => {
    const res = await axiosClient.put(`/tribunales/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: Estado01) => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/tribunales/${id}/estado`, { estado: nuevo });
    return res.data;
  },
};
