// src/services/tribunalesDocente.service.ts
import axiosClient from "../api/axiosClient";

export type MiTribunalItem = {
  id_tribunal_estudiante: number;
  id_tribunal: number;
  id_estudiante: number;

  estudiante: string; // "Nombres Apellidos"
  carrera?: string | null;
  fecha?: string | null; // fecha examen
  hora_inicio?: string | null;
  hora_fin?: string | null;

  cerrado?: 0 | 1;
};

export const tribunalesDocenteService = {
  misTribunales: async (): Promise<{ ok: true; data: MiTribunalItem[] }> => {
    const { data } = await axiosClient.get("/tribunales-estudiantes/mis");
    return data;
  },
};
