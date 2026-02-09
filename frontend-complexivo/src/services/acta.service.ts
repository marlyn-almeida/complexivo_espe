// src/services/actas.service.ts
import axiosClient from "../api/axiosClient";
import type { Acta, ActaGenerarRequest, ActaGenerarResponse } from "../types/acta";

export const actasService = {
  generar: async (payload: ActaGenerarRequest): Promise<ActaGenerarResponse> => {
    const res = await axiosClient.post("/actas/generar", payload);
    // tu controller devuelve {ok:true,data: result}
    return res.data?.data ?? res.data;
  },

  get: async (id_acta: number): Promise<Acta> => {
    const res = await axiosClient.get(`/actas/${id_acta}`);
    return res.data?.data ?? res.data;
  },
};
