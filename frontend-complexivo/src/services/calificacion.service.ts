// src/services/calificacion.service.ts
import axiosClient from "../api/axiosClient";
import type {
  MisCalificacionesResponse,
  GuardarCalificacionDocentePayload,
} from "../types/calificacionDocente";

export const calificacionService = {
  // DOCENTE: ver estructura + existentes para calificar
  mis: async (id_tribunal_estudiante: number): Promise<MisCalificacionesResponse> => {
    const { data } = await axiosClient.get(`/calificaciones/mis/${id_tribunal_estudiante}`);
    return data;
  },

  // DOCENTE: guardar calificaciones de mis criterios
  guardarMis: async (
    id_tribunal_estudiante: number,
    payload: GuardarCalificacionDocentePayload
  ): Promise<MisCalificacionesResponse> => {
    const { data } = await axiosClient.post(`/calificaciones/mis/${id_tribunal_estudiante}`, payload);
    return data;
  },
};
