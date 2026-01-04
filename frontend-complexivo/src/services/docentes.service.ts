import axiosClient from "../api/axiosClient";
import type { Docente, Estado01 } from "../types/docente";

export type DocenteListParams = {
  includeInactive?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};

export type DocenteCreateDTO = {
  id_institucional_docente: string;
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;

  correo_docente?: string;
  telefono_docente?: string;

  nombre_usuario: string;

  // opcional: si NO mandas, backend usa username como password inicial
  password?: string;
};

export type DocenteUpdateDTO = {
  id_institucional_docente: string;
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;

  correo_docente?: string;
  telefono_docente?: string;

  nombre_usuario: string;
};

export const docentesService = {
  // ✅ compatible con tu versión vieja:
  // docentesService.list(false)
  // y también con params:
  // docentesService.list({ includeInactive:false, q:"", page:1, limit:100 })
  list: async (arg: boolean | DocenteListParams = false): Promise<Docente[]> => {
    const paramsObj: DocenteListParams =
      typeof arg === "boolean" ? { includeInactive: arg } : arg;

    const limit = Math.min(paramsObj.limit ?? 100, 100);

    const res = await axiosClient.get<Docente[]>("/docentes", {
      params: {
        includeInactive: paramsObj.includeInactive ? 1 : 0,
        q: paramsObj.q?.trim() || undefined,
        page: paramsObj.page ?? 1,
        limit,
      },
    });

    return res.data ?? [];
  },

  get: async (id: number): Promise<Docente> => {
    const res = await axiosClient.get<Docente>(`/docentes/${id}`);
    return res.data;
  },

  create: async (payload: DocenteCreateDTO) => {
    const res = await axiosClient.post("/docentes", payload);
    return res.data;
  },

  update: async (id: number, payload: DocenteUpdateDTO) => {
    const res = await axiosClient.put(`/docentes/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: Estado01) => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/docentes/${id}/estado`, { estado: nuevo });
    return res.data;
  },
};
