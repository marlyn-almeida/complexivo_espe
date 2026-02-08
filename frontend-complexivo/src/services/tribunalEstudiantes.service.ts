// src/services/tribunalEstudiantes.service.ts
import axiosClient from "../api/axiosClient";
import type { TribunalEstudiante, Estado01 } from "../types/tribunalEstudiante";

const BASE = "/tribunales-estudiantes";

function pickArray(x: any): any[] | null {
  return Array.isArray(x) ? x : null;
}

function unwrapArray(res: any): TribunalEstudiante[] {
  const data = res?.data ?? res;
  return (
    pickArray(data) ||
    pickArray(data?.data) ||
    pickArray(data?.rows) ||
    pickArray(data?.result) ||
    pickArray(data?.data?.rows) ||
    pickArray(data?.data?.data) ||
    []
  ) as TribunalEstudiante[];
}

function unwrapObject<T = any>(res: any): T {
  const data = res?.data ?? res;
  return (data?.data ?? data) as T;
}

export type TribunalEstudianteListParams = {
  tribunalId?: number;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
};

export type TribunalEstudianteCreateDTO = {
  id_tribunal: number;
  id_estudiante: number;
  id_franja_horario: number;
  id_caso_estudio: number; // ✅ requerido ahora
};

export const tribunalEstudiantesService = {
  // =========================
  // LISTAR asignaciones
  // =========================
  list: async (params?: TribunalEstudianteListParams): Promise<TribunalEstudiante[]> => {
    const res = await axiosClient.get(BASE, {
      params: {
        tribunalId: params?.tribunalId,
        includeInactive: params?.includeInactive ? "true" : "false",
        page: params?.page,
        limit: params?.limit,
      },
    });
    return unwrapArray(res);
  },

  // =========================
  // CREAR asignación
  // ✅ exige id_caso_estudio
  // =========================
  create: async (payload: TribunalEstudianteCreateDTO): Promise<TribunalEstudiante> => {
    const res = await axiosClient.post(BASE, payload);
    return unwrapObject<TribunalEstudiante>(res);
  },

  // =========================
  // ACTIVAR / DESACTIVAR registro
  // (NO es cierre de defensa)
  // =========================
  toggleEstado: async (id: number, currentEstado: Estado01): Promise<TribunalEstudiante> => {
    const nuevo = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`${BASE}/${id}/estado`, { estado: !!nuevo });
    // backend espera boolean, por eso !!nuevo
    return unwrapObject<TribunalEstudiante>(res);
  },

  // =========================
  // ✅ CERRAR / REABRIR DEFENSA
  // ✅ backend real: PATCH /:id/cierre  body { cerrado: boolean }
  // =========================
  setCierre: async (id: number, cerrado: boolean): Promise<TribunalEstudiante> => {
    const res = await axiosClient.patch(`${BASE}/${id}/cierre`, { cerrado });
    return unwrapObject<TribunalEstudiante>(res);
  },

  cerrarDefensa: async (id: number) => tribunalEstudiantesService.setCierre(id, true),
  reabrirDefensa: async (id: number) => tribunalEstudiantesService.setCierre(id, false),

  // =========================
  // Rol 3: agenda de docente
  // =========================
  misAsignaciones: async (params?: { includeInactive?: boolean }): Promise<TribunalEstudiante[]> => {
    const res = await axiosClient.get(`${BASE}/mis-asignaciones`, {
      params: { includeInactive: params?.includeInactive ? "true" : "false" },
    });
    return unwrapArray(res);
  },
};
