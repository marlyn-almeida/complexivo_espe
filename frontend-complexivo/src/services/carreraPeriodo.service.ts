import axiosClient from "../api/axiosClient";
import type { CarreraPeriodo, CarreraPeriodoBulkDTO, PeriodoResumen } from "../types/carreraPeriodo";

export const carreraPeriodoService = {
  // Tabla principal por períodos
  resumen: async (params?: { includeInactive?: boolean; q?: string }): Promise<PeriodoResumen[]> => {
    const res = await axiosClient.get<PeriodoResumen[]>("/carreras-periodos/resumen", {
      params: params
        ? {
            includeInactive: params.includeInactive ? "true" : "false",
            q: params.q?.trim() || undefined,
          }
        : undefined,
    });
    return res.data ?? [];
  },

  // Carreras asignadas a un período
  listByPeriodo: async (
    periodoId: number,
    params?: { includeInactive?: boolean; q?: string }
  ): Promise<CarreraPeriodo[]> => {
    const res = await axiosClient.get<CarreraPeriodo[]>(`/carreras-periodos/por-periodo/${periodoId}`, {
      params: params
        ? {
            includeInactive: params.includeInactive ? "true" : "false",
            q: params.q?.trim() || undefined,
          }
        : undefined,
    });
    return res.data ?? [];
  },

  // ASIGNAR (no quita, activa + inserta) -> POST /bulk
  bulkAssign: async (payload: CarreraPeriodoBulkDTO) => {
    const res = await axiosClient.post("/carreras-periodos/bulk", payload);
    return res.data as { updated: boolean; items: CarreraPeriodo[] };
  },

  // EDITAR (sync: deja exactamente las seleccionadas activas) -> PUT /sync
  sync: async (payload: CarreraPeriodoBulkDTO) => {
    const res = await axiosClient.put("/carreras-periodos/sync", payload);
    return res.data as { synced: boolean; items: CarreraPeriodo[] };
  },
};
