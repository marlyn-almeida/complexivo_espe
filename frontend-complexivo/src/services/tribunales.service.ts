import axiosClient from "../api/axiosClient";
import type { Tribunal, Estado01 } from "../types/tribunal";

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

  caso?: number;
  descripcion_tribunal?: string;

  docentes: {
    presidente: number;   // id_carrera_docente
    integrante1: number;  // id_carrera_docente
    integrante2: number;  // id_carrera_docente
  };
};

export type TribunalUpdateDTO = {
  id_carrera_periodo: number;
  nombre_tribunal: string;
  caso?: number;
  descripcion_tribunal?: string;
  docentes?: {
    presidente?: number;
    integrante1?: number;
    integrante2?: number;
  };
};

export const tribunalesService = {
  list: async (params?: TribunalListParams): Promise<Tribunal[]> => {
    const limit = Math.min(params?.limit ?? 100, 100);

    const res = await axiosClient.get<Tribunal[]>("/tribunales", {
      params: {
        carreraPeriodoId: params?.carreraPeriodoId,
        // ✅ FIX: enviar boolean (backend usa toBoolean())
        includeInactive: Boolean(params?.includeInactive),
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

  create: async (payload: TribunalCreateDTO): Promise<Tribunal> => {
    const body = {
      ...payload,
      caso: typeof payload.caso === "number" && Number.isFinite(payload.caso) ? payload.caso : undefined,
      descripcion_tribunal: payload.descripcion_tribunal?.trim() || undefined,
      nombre_tribunal: payload.nombre_tribunal.trim(),
    };

    const res = await axiosClient.post<Tribunal>("/tribunales", body);
    return res.data;
  },

  update: async (id: number, payload: TribunalUpdateDTO): Promise<Tribunal> => {
    const body = {
      ...payload,
      caso: typeof payload.caso === "number" && Number.isFinite(payload.caso) ? payload.caso : undefined,
      descripcion_tribunal: payload.descripcion_tribunal?.trim() || undefined,
      nombre_tribunal: payload.nombre_tribunal.trim(),
    };

    const res = await axiosClient.put<Tribunal>(`/tribunales/${id}`, body);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: Estado01): Promise<Tribunal> => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch<Tribunal>(`/tribunales/${id}/estado`, { estado: nuevo === 1 });
    // ✅ OJO: backend espera boolean (en route: body("estado").isBoolean().toBoolean())
    return res.data;
  },

  // ✅ NUEVO (ROL 3): ver tribunales del docente logueado
  misTribunales: async (includeInactive = false): Promise<Tribunal[]> => {
    const res = await axiosClient.get<Tribunal[]>("/tribunales/mis-tribunales", {
      params: { includeInactive: Boolean(includeInactive) },
    });
    return res.data ?? [];
  },
};
