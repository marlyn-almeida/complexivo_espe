// src/services/notaTeorico.service.ts
import axiosClient from "../api/axiosClient";

export type NotaTeorico = {
  id_nota_teorico?: number;
  id_estudiante: number;
  id_carrera_periodo?: number;
  nota_teorico_20: number;
  observacion?: string | null;
  id_docente_registra?: number;
  created_at?: string;
  updated_at?: string;
};

export type NotaTeoricoUpsertDTO = {
  id_estudiante: number;
  nota_teorico_20: number;
  observacion?: string | null;
};

export const notaTeoricoService = {
  // ✅ GET /api/nota-teorico/:id_estudiante
  get: async (id_estudiante: number): Promise<NotaTeorico | null> => {
    const res = await axiosClient.get<NotaTeorico | null>(`/nota-teorico/${id_estudiante}`);
    return res.data ?? null;
  },

  // ✅ POST /api/nota-teorico (UPSERT)
  upsert: async (payload: NotaTeoricoUpsertDTO): Promise<NotaTeorico> => {
    const res = await axiosClient.post<NotaTeorico>(`/nota-teorico`, {
      id_estudiante: payload.id_estudiante,
      nota_teorico_20: payload.nota_teorico_20,
      observacion: payload.observacion ?? null,
    });
    return res.data;
  },
};
