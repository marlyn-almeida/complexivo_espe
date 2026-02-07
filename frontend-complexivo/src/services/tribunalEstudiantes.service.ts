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

function unwrapObject(res: any): any {
  const data = res?.data ?? res;
  return data?.data ?? data;
}

export type TribunalEstudianteListParams = {
  tribunalId?: number;
  includeInactive?: boolean;
  // ✅ opcional (tu backend puede ignorarlo; no rompe)
  page?: number;
  limit?: number;
};

export type TribunalEstudianteCreateDTO = {
  id_tribunal: number;
  id_estudiante: number;
  id_franja_horario: number;
};

export const tribunalEstudiantesService = {
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

  create: async (payload: TribunalEstudianteCreateDTO) => {
    const res = await axiosClient.post(BASE, payload);
    return unwrapObject(res);
  },

  toggleEstado: async (id: number, currentEstado: Estado01) => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`${BASE}/${id}/estado`, { estado: nuevo });
    return unwrapObject(res);
  },

  // ✅ Rol 3 agenda
  misAsignaciones: async (params?: { includeInactive?: boolean }) => {
    const res = await axiosClient.get(`${BASE}/mis-asignaciones`, {
      params: { includeInactive: params?.includeInactive ? "true" : "false" },
    });
    return unwrapArray(res);
  },
};
