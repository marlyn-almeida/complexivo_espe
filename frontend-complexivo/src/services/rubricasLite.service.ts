// src/services/rubricasLite.service.ts
import axiosClient from "../api/axiosClient";
import type { RubricaLite, RubricaComponenteLite } from "../types/rubrica";

function unwrapArray<T = any>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];

  // { ok:true, data:[...] }
  if (payload.ok && Array.isArray(payload.data)) return payload.data as T[];

  // { data:[...] }
  if (Array.isArray(payload.data)) return payload.data as T[];

  // doble wrapper
  if (payload.ok && payload.data && Array.isArray(payload.data.data)) return payload.data.data as T[];
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data as T[];

  return [];
}

export const rubricasLiteService = {
  // ✅ Lista rúbricas por CP (tu backend puede leer CP por header global de axiosClient)
  listByCP: async (carreraPeriodoId: number): Promise<RubricaLite[]> => {
    // Importante: NO fuerces headers raros aquí.
    // Tu app ya maneja el contexto (x-id-carrera-periodo / x-carrera-periodo-id) desde axiosClient.
    const res = await axiosClient.get("/rubricas", {
      params: { includeInactive: false, carreraPeriodoId }, // si backend lo ignora, no pasa nada
    });
    return unwrapArray<RubricaLite>(res.data);
  },

  // ✅ Componentes de una rúbrica
  listComponentes: async (id_rubrica: number): Promise<RubricaComponenteLite[]> => {
    const res = await axiosClient.get(`/rubricas/${id_rubrica}/componentes`, {
      params: { includeInactive: false },
    });
    return unwrapArray<RubricaComponenteLite>(res.data);
  },
};
