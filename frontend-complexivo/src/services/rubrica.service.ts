import axiosClient from "../api/axiosClient";
import type { Rubrica } from "../types/rubrica";

export const rubricaService = {
  getByPeriodo: async (periodoId: number) => {
    const res = await axiosClient.get(`/rubricas/periodo/${periodoId}`);
    return res.data as Rubrica;
  },

  ensureByPeriodo: async (
    periodoId: number,
    payload?: {
      nombre_rubrica?: string;
      descripcion_rubrica?: string;
      ponderacion_global?: number;
    }
  ) => {
    const res = await axiosClient.post(
      `/rubricas/periodo/${periodoId}`,
      payload ?? {}
    );
    return res.data as { created: boolean; rubrica: Rubrica };
  },

  update: async (
    id: number,
    payload: {
      nombre_rubrica?: string;
      descripcion_rubrica?: string;
      ponderacion_global?: number;
    }
  ) => {
    const res = await axiosClient.put(`/rubricas/${id}`, payload);
    return res.data as Rubrica;
  },

  changeEstado: async (id: number, estado: boolean) => {
    const res = await axiosClient.patch(`/rubricas/${id}/estado`, { estado });
    return res.data;
  },
};
