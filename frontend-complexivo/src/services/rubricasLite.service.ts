import axiosClient from "../api/axiosClient";
import type { RubricaLite, RubricaComponenteLite } from "../types/rubrica";

const CP_HEADER = "x-id-carrera-periodo";

/**
 * ⚠️ Ajusta estos endpoints si en tu backend ya existen con otro path.
 * - listByCP: lista rúbricas del período
 * - listComponentes: lista componentes de una rúbrica
 */
export const rubricasLiteService = {
  listByCP: async (carreraPeriodoId: number): Promise<RubricaLite[]> => {
    // ✅ endpoint típico (si el tuyo es otro, cámbialo aquí)
    const { data } = await axiosClient.get("/rubricas", {
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
      params: { includeInactive: false },
    });
    // soporta {ok,data} o data directo
    return (data?.data ?? data ?? []) as RubricaLite[];
  },

  listComponentes: async (id_rubrica: number): Promise<RubricaComponenteLite[]> => {
    // ✅ endpoint típico (si el tuyo es otro, cámbialo aquí)
    const { data } = await axiosClient.get(`/rubricas/${id_rubrica}/componentes`, {
      params: { includeInactive: false },
    });
    return (data?.data ?? data ?? []) as RubricaComponenteLite[];
  },
};
