import axiosClient from "../api/axiosClient";
import type { CalificadorGeneral, CalificadorGeneralCreate } from "../types/calificadorGeneral";

const CP_HEADER = "x-id-carrera-periodo"; // ✅ cambia si tu middleware usa otro header

export const calificadoresGeneralesService = {
  list: async (carreraPeriodoId: number, includeInactive = false): Promise<CalificadorGeneral[]> => {
    const { data } = await axiosClient.get("/calificadores-generales", {
      params: { includeInactive },
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
    });
    return (data?.data ?? []) as CalificadorGeneral[];
  },

  create: async (carreraPeriodoId: number, payload: CalificadorGeneralCreate): Promise<number> => {
    const { data } = await axiosClient.post("/calificadores-generales", payload, {
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
    });
    return Number(data?.id);
  },

  remove: async (id_cp_calificador_general: number): Promise<void> => {
    await axiosClient.delete(`/calificadores-generales/${id_cp_calificador_general}`);
  },
};
