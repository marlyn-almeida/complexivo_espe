import axiosClient from "../api/axiosClient";
import type { Estudiante, Estado01 } from "../types/estudiante";

export type EstudianteListParams = {
  carreraPeriodoId?: number;
  includeInactive?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};

export type EstudianteCreateDTO = {
  id_carrera_periodo: number;
  id_institucional_estudiante: string;
  nombres_estudiante: string;
  apellidos_estudiante: string;
  correo_estudiante?: string;
  telefono_estudiante?: string;
};

export type EstudianteUpdateDTO = EstudianteCreateDTO;

export const estudiantesService = {
  list: async (params?: EstudianteListParams): Promise<Estudiante[]> => {
    const limit = Math.min(params?.limit ?? 100, 100); // ✅ nunca pasa de 100

    const res = await axiosClient.get<Estudiante[]>("/estudiantes", {
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

  get: async (id: number): Promise<Estudiante> => {
    const res = await axiosClient.get<Estudiante>(`/estudiantes/${id}`);
    return res.data;
  },

  create: async (payload: EstudianteCreateDTO) => {
    const res = await axiosClient.post("/estudiantes", payload);
    return res.data;
  },

  update: async (id: number, payload: EstudianteUpdateDTO) => {
    const res = await axiosClient.put(`/estudiantes/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: Estado01) => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/estudiantes/${id}/estado`, { estado: nuevo });
    return res.data;
  },
};
