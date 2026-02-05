import axiosClient from "../api/axiosClient";
import type { CalificadorGeneral, CalificadorGeneralCreate } from "../types/calificadorGeneral";

export const calificadoresGeneralesService = {
  list: async (): Promise<CalificadorGeneral[]> => {
    const { data } = await axiosClient.get("/calificadores-generales");
    return data;
  },

  create: async (payload: CalificadorGeneralCreate): Promise<CalificadorGeneral> => {
    const { data } = await axiosClient.post("/calificadores-generales", payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/calificadores-generales/${id}`);
  },
};
