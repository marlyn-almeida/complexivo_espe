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
    presidente: number; // id_carrera_docente
    integrante1: number;
    integrante2: number;
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
        // ✅ backend espera boolean string para isBoolean + query.includeInactive === "true"
        includeInactive: params?.includeInactive ? "true" : "false",
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
    const body = {
      ...payload,
      caso: typeof payload.caso === "number" ? payload.caso : undefined,
      descripcion_tribunal: payload.descripcion_tribunal?.trim() || undefined,
    };

    const res = await axiosClient.post("/tribunales", body);
    return res.data;
  },

  update: async (id: number, payload: TribunalUpdateDTO) => {
    const body = {
      ...payload,
      caso: typeof payload.caso === "number" ? payload.caso : undefined,
      descripcion_tribunal: payload.descripcion_tribunal?.trim() || undefined,
    };

    const res = await axiosClient.put(`/tribunales/${id}`, body);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: Estado01) => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/tribunales/${id}/estado`, { estado: nuevo });
    return res.data;
  },
};
