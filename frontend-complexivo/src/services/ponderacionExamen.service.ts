import axiosClient from "../api/axiosClient";
import type { PonderacionExamen, PonderacionExamenUpdate } from "../types/ponderacionExamen";

export const ponderacionExamenService = {
  get: async (): Promise<PonderacionExamen> => {
    const { data } = await axiosClient.get("/ponderaciones-examen");
    return data;
  },

  update: async (payload: PonderacionExamenUpdate): Promise<PonderacionExamen> => {
    const { data } = await axiosClient.put("/ponderaciones-examen", payload);
    return data;
  },
};
