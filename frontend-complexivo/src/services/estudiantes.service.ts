import axiosClient from "../api/axiosClient";

export type Estado01 = 0 | 1;

export interface Estudiante {
  id_estudiante: number;
  id_carrera_periodo: number;

  id_institucional_estudiante: string;
  nombres_estudiante: string;
  apellidos_estudiante: string;

  correo_estudiante?: string | null;
  telefono_estudiante?: string | null;

  estado: Estado01;

  created_at?: string;
  updated_at?: string | null;

  // joins opcionales si el backend los manda
  nombre_carrera?: string;
  codigo_periodo?: string;
}

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
  list: async (params?: {
    includeInactive?: boolean;
    q?: string;
    carreraPeriodoId?: number | null;
    page?: number;
    limit?: number;
  }): Promise<Estudiante[]> => {
    const res = await axiosClient.get<Estudiante[]>("/estudiantes", { params });
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
