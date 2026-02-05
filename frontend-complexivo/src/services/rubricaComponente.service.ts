import axiosClient from "../api/axiosClient";

export type RubricaComponente = {
  id_rubrica_componente: number;
  id_rubrica: number;
  nombre_componente: string;
  tipo_componente: "ESCRITA" | "ORAL" | "OTRO";
  ponderacion: number | string;
  orden: number;
  estado?: boolean | number;
};

function unwrapArray<T = any>(payload: any): T[] {
  if (!payload) return [];

  // ✅ si ya es array
  if (Array.isArray(payload)) return payload as T[];

  // ✅ wrapper { ok, data: [...] }
  if (payload.ok && Array.isArray(payload.data)) return payload.data as T[];

  // ✅ wrapper { data: [...] }
  if (Array.isArray(payload.data)) return payload.data as T[];

  // ✅ wrapper doble { ok, data: { ok, data: [...] } }
  if (payload.ok && payload.data && Array.isArray(payload.data.data)) return payload.data.data as T[];

  // ✅ wrapper doble { data: { data: [...] } }
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data as T[];

  return [];
}

export const rubricaComponenteService = {
  list: async (rubricaId: number, params?: { includeInactive?: boolean }): Promise<RubricaComponente[]> => {
    const res = await axiosClient.get(`/rubricas/${rubricaId}/componentes`, { params });
    return unwrapArray<RubricaComponente>(res.data);
  },

  create: async (
    rubricaId: number,
    payload: {
      nombre_componente: string;
      tipo_componente?: "ESCRITA" | "ORAL" | "OTRO";
      ponderacion?: number;
      orden: number;
    }
  ) => {
    const res = await axiosClient.post(`/rubricas/${rubricaId}/componentes`, payload);
    return res.data;
  },

  update: async (
    rubricaId: number,
    id: number,
    payload: {
      nombre_componente?: string;
      tipo_componente?: "ESCRITA" | "ORAL" | "OTRO";
      ponderacion?: number;
      orden?: number;
    }
  ) => {
    const res = await axiosClient.put(`/rubricas/${rubricaId}/componentes/${id}`, payload);
    return res.data;
  },

  changeEstado: async (rubricaId: number, id: number, estado: boolean) => {
    const res = await axiosClient.patch(`/rubricas/${rubricaId}/componentes/${id}/estado`, { estado });
    return res.data;
  },
};
