// ✅ src/services/entregasCaso.service.ts
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
  id_caso_estudio?: number;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
};

export const entregasCasoService = {
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

  // ⚠️ tu backend NO tiene GET /entregas-caso/:id (por ahora)
  // si NO lo usas, déjalo, pero si te da 404, elimínalo o crea endpoint
  get: async (id: number): Promise<EntregaCaso> => {
    const res = await axiosClient.get(`${BASE}/${id}`);
    return unwrapObject(res) as EntregaCaso;
  },

  subir: async (payload: EntregaCasoCreateDTO): Promise<EntregaCaso> => {
    const formData = new FormData();
    formData.append("id_estudiante", String(payload.id_estudiante));
    formData.append("id_caso_estudio", String(payload.id_caso_estudio));
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

  // ✅ ✅ ✅ DESCARGA REAL (coincide con tu backend)
  download: async (id_estudiante: number, id_caso_estudio: number) => {
    return axiosClient.get(`${BASE}/${id_estudiante}/${id_caso_estudio}/download`, {
      responseType: "blob",
      transformResponse: (r) => r,
    });
  },
};
