// src/services/estudiantes.service.ts
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

  // ✅ NUEVO (username para login o identificación)
  nombre_usuario: string;

  cedula: string;

  nombres_estudiante: string;
  apellidos_estudiante: string;
  correo_estudiante?: string;
  telefono_estudiante?: string;
};

export type EstudianteUpdateDTO = EstudianteCreateDTO;

// ✅ Tipos del payload de asignaciones (lo que devuelve /estudiantes/:id/asignaciones)
export type NotaTeoricoAsignacion = {
  id_nota_teorico?: number;
  id_estudiante: number;
  id_carrera_periodo: number;
  nota_teorico_20: number;
  observacion?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CasoAsignado = {
  id_caso_estudio: number;
  numero_caso?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
  archivo_pdf?: string | null;
  id_tribunal?: number;
};

export type EntregaCaso = {
  id_entrega: number;
  id_estudiante: number;
  id_caso_estudio: number;
  archivo_pdf?: string | null;
  observacion?: string | null;
  created_at?: string;
};

export type EstudianteAsignacionesPayload = {
  estudiante: Estudiante;
  nota_teorico: NotaTeoricoAsignacion | null;
  caso: CasoAsignado | null;
  entrega: EntregaCaso | null;
};

export const estudiantesService = {
  list: async (params?: EstudianteListParams): Promise<Estudiante[]> => {
    const limit = Math.min(params?.limit ?? 100, 100);

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

  // ✅ NUEVO: Trae todo lo necesario para la pantalla Asignaciones
  getAsignaciones: async (id: number): Promise<EstudianteAsignacionesPayload> => {
    const res = await axiosClient.get<EstudianteAsignacionesPayload>(`/estudiantes/${id}/asignaciones`);
    return res.data;
  },

  create: async (payload: EstudianteCreateDTO): Promise<Estudiante> => {
    const res = await axiosClient.post<Estudiante>("/estudiantes", payload);
    return res.data;
  },

  update: async (id: number, payload: EstudianteUpdateDTO): Promise<Estudiante> => {
    const res = await axiosClient.put<Estudiante>(`/estudiantes/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: Estado01): Promise<Estudiante> => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch<Estudiante>(`/estudiantes/${id}/estado`, {
      estado: nuevo,
    });
    return res.data;
  },
};
