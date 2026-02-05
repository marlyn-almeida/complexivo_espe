import axiosClient from "../api/axiosClient";
import type { NotaTeorico, NotaTeoricoUpsert } from "../types/notaTeorico";

export const notaTeoricoService = {
  list: async (): Promise<NotaTeorico[]> => {
    const { data } = await axiosClient.get("/nota-teorico");
    return data;
  },

  upsert: async (payload: NotaTeoricoUpsert): Promise<NotaTeorico> => {
    const { data } = await axiosClient.post("/nota-teorico", payload);
    return data;
  },
};
