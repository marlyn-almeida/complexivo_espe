// src/services/calificadoresGenerales.service.ts
import axiosClient from "../api/axiosClient";
import type { CalificadorGeneral, CalificadorGeneralCreate } from "../types/calificadorGeneral";

/**
 * IMPORTANTE:
 * - CP se resuelve por ctx middleware (req.ctx.id_carrera_periodo)
 * - axiosClient manda "x-carrera-periodo-id" automáticamente
 * - aquí NO mandamos id_carrera_periodo por query
 */
export const calificadoresGeneralesService = {
  list: async (includeInactive = false): Promise<CalificadorGeneral[]> => {
    const { data } = await axiosClient.get("/calificadores-generales", {
      params: { includeInactive },
    });
    return (data?.data ?? []) as CalificadorGeneral[];
  },

  create: async (payload: CalificadorGeneralCreate): Promise<number> => {
    const { data } = await axiosClient.post("/calificadores-generales", payload);
    return Number(data?.id);
  },

  remove: async (id_cp_calificador_general: number): Promise<void> => {
    await axiosClient.delete(`/calificadores-generales/${id_cp_calificador_general}`);
  },
};
