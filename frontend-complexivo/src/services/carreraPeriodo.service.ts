import axiosClient from "../api/axiosClient";
import type { CarreraPeriodo, PeriodoResumen, CarreraPeriodoBulkDTO } from "../types/carreraPeriodo";

export const carreraPeriodoService = {
  // ✅ tabla principal: periodos + conteos
  resumen: async (params?: { includeInactive?: boolean; q?: string }): Promise<PeriodoResumen[]> => {
    const res = await axiosClient.get<PeriodoResumen[]>("/carreras-periodos/resumen", {
      params: {
        includeInactive: params?.includeInactive ? "true" : "false",
        q: params?.q?.trim() || undefined,
      },
    });
    return res.data ?? [];
  },

  // ✅ ver/editar: carreras asignadas a un periodo
  listByPeriodo: async (periodoId: number, params?: { includeInactive?: boolean; q?: string }): Promise<CarreraPeriodo[]> => {
    const res = await axiosClient.get<CarreraPeriodo[]>(`/carreras-periodos/por-periodo/${periodoId}`, {
      params: {
        includeInactive: params?.includeInactive ? "true" : "false",
        q: params?.q?.trim() || undefined,
      },
    });
    return res.data ?? [];
  },

  // ✅ Asignar (no quita, activa + inserta)
  bulkAssign: async (payload: CarreraPeriodoBulkDTO) => {
    const res = await axiosClient.post("/carreras-periodos/bulk", payload);
    return res.data as { updated: boolean; items: CarreraPeriodo[] };
  },

  // ✅ Editar (sync): deja exactamente las seleccionadas activas
  sync: async (payload: CarreraPeriodoBulkDTO) => {
    const res = await axiosClient.put("/carreras-periodos/sync", payload);
    return res.data as { synced: boolean; items: CarreraPeriodo[] };
  },
};
