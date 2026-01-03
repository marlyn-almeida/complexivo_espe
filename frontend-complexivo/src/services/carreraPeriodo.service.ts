import axiosClient from "../api/axiosClient";
import type { CarreraPeriodo, CarreraPeriodoBulkDTO, PeriodoResumen } from "../types/carreraPeriodo";

// ✅ types director/apoyo
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

// ✅ Params avanzados (cuando quieras filtrar)
export type CarreraPeriodoListParams = {
  includeInactive?: boolean;
  q?: string;
  periodoId?: number | null;
  page?: number;
  limit?: number;
};

export const carreraPeriodoService = {
  /**
   * ✅ list() estilo Carreras/Docentes:
   * - list(false)  -> includeInactive = false
   * - list(true)   -> includeInactive = true
   * - list({ includeInactive, q, periodoId }) -> modo avanzado
   */
  list: async (arg: boolean | CarreraPeriodoListParams = false): Promise<CarreraPeriodo[]> => {
    let params: CarreraPeriodoListParams;

    if (typeof arg === "boolean") {
      params = { includeInactive: arg, page: 1, limit: 200 };
    } else {
      params = {
        page: arg.page ?? 1,
        limit: arg.limit ?? 200,
        includeInactive: arg.includeInactive ?? false,
        q: arg.q?.trim() || undefined,
        periodoId: arg.periodoId ?? undefined,
      };
    }

    const res = await axiosClient.get<CarreraPeriodo[]>("/carreras-periodos/list", {
      params: {
        page: params.page,
        limit: params.limit,
        includeInactive: params.includeInactive ? "true" : "false",
        q: params.q,
        periodoId: params.periodoId ?? undefined,
      },
    });

    return res.data ?? [];
  },

  // =========================
  // Tu flujo existente
  // =========================
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

  listByPeriodo: async (
    periodoId: number,
    params?: { includeInactive?: boolean; q?: string }
  ): Promise<CarreraPeriodo[]> => {
    const res = await axiosClient.get<CarreraPeriodo[]>(
      `/carreras-periodos/por-periodo/${periodoId}`,
      {
        params: params
          ? {
              includeInactive: params.includeInactive ? "true" : "false",
              q: params.q?.trim() || undefined,
            }
          : undefined,
      }
    );
    return res.data ?? [];
  },

  bulkAssign: async (payload: CarreraPeriodoBulkDTO) => {
    const res = await axiosClient.post("/carreras-periodos/bulk", payload);
    return res.data as { updated: boolean; items: CarreraPeriodo[] };
  },

  sync: async (payload: CarreraPeriodoBulkDTO) => {
    const res = await axiosClient.put("/carreras-periodos/sync", payload);
    return res.data as { synced: boolean; items: CarreraPeriodo[] };
  },

  // =========================
  // Admins (director/apoyo)
  // =========================
  getAdmins: async (idCarreraPeriodo: number): Promise<CarreraPeriodoAdminsResponse> => {
    const res = await axiosClient.get<CarreraPeriodoAdminsResponse>(
      `/carreras-periodos/${idCarreraPeriodo}/admin`
    );
    return res.data;
  },

  setAdmins: async (idCarreraPeriodo: number, payload: CarreraPeriodoAdminsUpdateDTO) => {
    const res = await axiosClient.put(`/carreras-periodos/${idCarreraPeriodo}/admin`, payload);
    return res.data as CarreraPeriodoAdminsResponse;
  },
};
