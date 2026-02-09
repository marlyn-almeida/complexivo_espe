// src/services/calificacionesDocente.service.ts
import axiosClient from "../api/axiosClient";
import type {
  MisCalificacionesResponse,
  GuardarCalificacionesPayload,
} from "../types/calificacionDocente";

export const calificacionesDocenteService = {
  // GET /calificaciones/mis/:id_tribunal_estudiante  (ajusta ruta si tu backend usa otra)
  misCalificaciones: async (id_tribunal_estudiante: number): Promise<MisCalificacionesResponse> => {
    const res = await axiosClient.get(`/calificaciones/mis/${id_tribunal_estudiante}`);
    return (res.data?.data ? res.data : { ok: true, data: res.data }) as MisCalificacionesResponse;
  },

  // POST /calificaciones/mis/:id_tribunal_estudiante
  guardar: async (id_tribunal_estudiante: number, payload: GuardarCalificacionesPayload) => {
    const res = await axiosClient.post(`/calificaciones/mis/${id_tribunal_estudiante}`, payload);
    return res.data;
  },
};
