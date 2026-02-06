import axiosClient from "../api/axiosClient";
import type { Tribunal, Estado01 } from "../types/tribunal";

function pickArray(x: any): any[] | null {
  return Array.isArray(x) ? x : null;
}

function unwrapArray(res: any): Tribunal[] {
  const data = res?.data ?? res;
  return (
    pickArray(data) ||
    pickArray(data?.data) ||
    pickArray(data?.rows) ||
    pickArray(data?.result) ||
    pickArray(data?.data?.rows) ||
    pickArray(data?.data?.data) ||
    []
  ) as Tribunal[];
}

function unwrapObject(res: any): any {
  const data = res?.data ?? res;
  return data?.data ?? data;
}

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

    const res = await axiosClient.get("/tribunales", {
      params: {
        carreraPeriodoId: params?.carreraPeriodoId,
        includeInactive: params?.includeInactive ? "true" : "false",
        q: params?.q?.trim() || undefined,
        page: params?.page ?? 1,
        limit,
      },
    });

    return unwrapArray(res);
  },

  get: async (id: number): Promise<Tribunal> => {
    const res = await axiosClient.get(`/tribunales/${id}`);
    return unwrapObject(res) as Tribunal;
  },

  create: async (payload: TribunalCreateDTO) => {
    const body = {
      ...payload,
      caso: typeof payload.caso === "number" ? payload.caso : undefined,
      descripcion_tribunal: payload.descripcion_tribunal?.trim() || undefined,
    };

    const res = await axiosClient.post("/tribunales", body);
    return unwrapObject(res);
  },

  update: async (id: number, payload: TribunalUpdateDTO) => {
    const body = {
      ...payload,
      caso: typeof payload.caso === "number" ? payload.caso : undefined,
      descripcion_tribunal: payload.descripcion_tribunal?.trim() || undefined,
    };

    const res = await axiosClient.put(`/tribunales/${id}`, body);
    return unwrapObject(res);
  },

  toggleEstado: async (id: number, currentEstado: Estado01) => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/tribunales/${id}/estado`, { estado: nuevo });
    return unwrapObject(res);
  },
};
