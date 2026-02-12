// ✅ src/services/calificacion.service.ts
import axiosClient from "../api/axiosClient";
import type {
  MisCalificacionesResponse,
  GuardarCalificacionesPayload,
} from "../types/calificacionDocente";

export const calificacionService = {
  mis: async (id_tribunal_estudiante: number): Promise<MisCalificacionesResponse> => {
    const { data } = await axiosClient.get(`/calificaciones/mis/${id_tribunal_estudiante}`);
    return data;
  },

  guardarMis: async (
    id_tribunal_estudiante: number,
    payload: GuardarCalificacionesPayload
  ): Promise<MisCalificacionesResponse> => {
    const { data } = await axiosClient.post(`/calificaciones/mis/${id_tribunal_estudiante}`, payload);
    return data;
  },
};
