import axiosClient from "../api/axiosClient";
import type { CarreraPeriodo, CarreraPeriodoCreateDTO, CarreraPeriodoBulkCreateDTO } from "../types/carreraPeriodo";

export const carreraPeriodoService = {
  list: async (params?: {
    includeInactive?: boolean;
    carreraId?: number | null;
    periodoId?: number | null;
    q?: string;
  }): Promise<CarreraPeriodo[]> => {
    const res = await axiosClient.get<CarreraPeriodo[]>("/carreras-periodos", {
      params: params
        ? {
            includeInactive: params.includeInactive ? "true" : "false",
            carreraId: params.carreraId ?? undefined,
            periodoId: params.periodoId ?? undefined,
            q: params.q?.trim() || undefined,
          }
        : undefined,
    });
    return res.data ?? [];
  },

  getById: async (id: number) => {
    const res = await axiosClient.get<CarreraPeriodo>(`/carreras-periodos/${id}`);
    return res.data;
  },

  create: async (payload: CarreraPeriodoCreateDTO) => {
    const res = await axiosClient.post("/carreras-periodos", payload);
    return res.data;
  },

  // ✅ BULK
  bulkAssign: async (payload: CarreraPeriodoBulkCreateDTO) => {
    const res = await axiosClient.post("/carreras-periodos/bulk", payload);
    return res.data as { createdCount: number; items: CarreraPeriodo[] };
  },

  update: async (id: number, payload: CarreraPeriodoCreateDTO) => {
    const res = await axiosClient.put(`/carreras-periodos/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: 0 | 1) => {
    const nuevoEstadoBool = currentEstado === 1 ? false : true;
    const res = await axiosClient.patch(`/carreras-periodos/${id}/estado`, {
      estado: nuevoEstadoBool,
    });
    return res.data;
  },
};
