// src/services/entregasCaso.service.ts
import axiosClient from "../api/axiosClient";
import type { EntregaCaso, EntregaCasoCreateDTO, Estado01 } from "../types/entregaCaso";

const BASE = "/entregas-caso";

function pickArray(x: any): any[] | null {
  return Array.isArray(x) ? x : null;
}

function unwrapArray(res: any): EntregaCaso[] {
  const data = res?.data ?? res;
  return (
    pickArray(data) ||
    pickArray(data?.data) ||
    pickArray(data?.rows) ||
    pickArray(data?.result) ||
    pickArray(data?.data?.rows) ||
    pickArray(data?.data?.data) ||
    []
  ) as EntregaCaso[];
}

function unwrapObject(res: any): any {
  const data = res?.data ?? res;
  return data?.data ?? data;
}

export type EntregaCasoListParams = {
  id_estudiante?: number;
  id_caso_estudio?: number; // (si tu backend lo soporta; si no, no afecta)
  includeInactive?: boolean;
  page?: number;
  limit?: number;
};

export const entregasCasoService = {
  // ✅ Listado (si lo usas en otra pantalla)
  list: async (params?: EntregaCasoListParams): Promise<EntregaCaso[]> => {
    const res = await axiosClient.get(BASE, {
      params: {
        id_estudiante: params?.id_estudiante,
        id_caso_estudio: params?.id_caso_estudio,
        includeInactive: params?.includeInactive ? "true" : "false",
        page: params?.page,
        limit: params?.limit,
      },
    });
    return unwrapArray(res);
  },

  // ✅ Obtener 1 entrega por ID (si existe endpoint)
  get: async (id: number): Promise<EntregaCaso> => {
    const res = await axiosClient.get(`${BASE}/${id}`);
    return unwrapObject(res) as EntregaCaso;
  },

  // ✅ Subir/Reemplazar entrega (multipart/form-data)
  // Tu regla: una entrega vigente por estudiante → el backend debe sobrescribir/actualizar.
  subir: async (payload: EntregaCasoCreateDTO): Promise<EntregaCaso> => {
    const formData = new FormData();
    formData.append("id_estudiante", String(payload.id_estudiante));
    formData.append("id_caso_estudio", String(payload.id_caso_estudio)); // si tu backend lo usa para validar relación, ok
    formData.append("archivo", payload.archivo);
    if (payload.observacion) formData.append("observacion", payload.observacion);

    const res = await axiosClient.post(BASE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return unwrapObject(res) as EntregaCaso;
  },

  toggleEstado: async (id: number, estadoActual: Estado01) => {
    const nuevo: Estado01 = estadoActual === 1 ? 0 : 1;
    const res = await axiosClient.patch(`${BASE}/${id}/estado`, { estado: nuevo });
    return unwrapObject(res);
  },

  // =========================================================
  // ✅ DESCARGAS
  // =========================================================

  /**
   * ✅ Descarga por ID de entrega
   * Endpoint esperado: GET /entregas-caso/:id/download
   */
  downloadById: async (id_entrega: number) => {
    return axiosClient.get(`${BASE}/${id_entrega}/download`, { responseType: "blob" });
  },

  /**
   * ✅ Descarga por estudiante (TU REGLA REAL)
   * Endpoint recomendado: GET /entregas-caso/estudiante/:id/download
   * Si tu backend todavía no lo tiene, lo implementas y listo.
   */
  downloadByEstudiante: async (id_estudiante: number) => {
    return axiosClient.get(`${BASE}/estudiante/${id_estudiante}/download`, { responseType: "blob" });
  },

  /**
   * ✅ Helper opcional:
   * intenta descargar por ID si lo tienes; si no, por estudiante.
   */
  downloadPreferente: async (args: { id_entrega?: number; id_estudiante: number }) => {
    if (args.id_entrega && args.id_entrega > 0) {
      return entregasCasoService.downloadById(args.id_entrega);
    }
    return entregasCasoService.downloadByEstudiante(args.id_estudiante);
  },
};
