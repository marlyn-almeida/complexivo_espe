import axiosClient from "../api/axiosClient";
import type { CarreraPeriodo, CarreraPeriodoBulkDTO, PeriodoResumen } from "../types/carreraPeriodo";

// ✅ NUEVO: types para director/apoyo
export type TipoAdmin = "DIRECTOR" | "APOYO";

export type AdminDocenteLite = {
  tipo_admin: TipoAdmin;
  id_docente: number;
  nombres_docente: string;
  apellidos_docente: string;
  nombre_usuario: string;
};

export type CarreraPeriodoAdminsResponse = {
  id_carrera_periodo: number;
  director: AdminDocenteLite | null;
  apoyo: AdminDocenteLite | null;
};

export type CarreraPeriodoAdminsUpdateDTO = {
  id_docente_director?: number | null;
  id_docente_apoyo?: number | null;
};

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

  // =========================================================
  // ✅ NUEVO: para pantalla "Asignar Director/Apoyo"
  // =========================================================

  // Lista completa carrera_periodo + joins -> GET /list
  listAll: async (params?: { includeInactive?: boolean; q?: string; periodoId?: number | null }): Promise<CarreraPeriodo[]> => {
    const res = await axiosClient.get<CarreraPeriodo[]>("/carreras-periodos/list", {
      params: params
        ? {
            includeInactive: params.includeInactive ? "true" : "false",
            q: params.q?.trim() || undefined,
            periodoId: params.periodoId || undefined,
          }
        : undefined,
    });
    return res.data ?? [];
  },

  // Ver asignación actual (director/apoyo)
  getAdmins: async (idCarreraPeriodo: number): Promise<CarreraPeriodoAdminsResponse> => {
    const res = await axiosClient.get<CarreraPeriodoAdminsResponse>(`/carreras-periodos/${idCarreraPeriodo}/admin`);
    return res.data;
  },

  // Guardar asignación
  setAdmins: async (idCarreraPeriodo: number, payload: CarreraPeriodoAdminsUpdateDTO) => {
    const res = await axiosClient.put(`/carreras-periodos/${idCarreraPeriodo}/admin`, payload);
    return res.data as CarreraPeriodoAdminsResponse;
  },
};
