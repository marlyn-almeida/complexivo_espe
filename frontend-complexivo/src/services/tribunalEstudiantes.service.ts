// src/services/tribunalEstudiantes.service.ts
import axiosClient from "../api/axiosClient";
import type { TribunalEstudiante, Estado01 } from "../types/tribunalEstudiante";

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
};

const BASE = "/tribunales-estudiantes"; // ✅ PLURAL (como está montado en el backend)

export const tribunalEstudiantesService = {
  list: async (params?: TribunalEstudianteListParams): Promise<TribunalEstudiante[]> => {
    const limit = Math.min(params?.limit ?? 100, 100);

    const res = await axiosClient.get<TribunalEstudiante[]>(BASE, {
      params: {
        tribunalId: params?.tribunalId,
        includeInactive: params?.includeInactive ? 1 : 0,
        page: params?.page ?? 1,
        limit,
      },
    });

    return res.data ?? [];
  },

  create: async (payload: TribunalEstudianteCreateDTO) => {
    const res = await axiosClient.post(BASE, payload);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: Estado01) => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`${BASE}/${id}/estado`, { estado: nuevo });
    return res.data;
  },
};
