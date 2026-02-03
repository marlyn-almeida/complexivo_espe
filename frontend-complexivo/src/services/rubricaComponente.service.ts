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
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload.data)) return payload.data as T[];
  if (payload.ok && Array.isArray(payload.data)) return payload.data as T[];
  return [];
}

export const rubricaComponenteService = {
  list: async (rubricaId: number, params?: { includeInactive?: boolean }) => {
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
    return res.data as RubricaComponente;
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
    return res.data as RubricaComponente;
  },

  changeEstado: async (rubricaId: number, id: number, estado: boolean) => {
    const res = await axiosClient.patch(`/rubricas/${rubricaId}/componentes/${id}/estado`, { estado });
    return res.data;
  },
};
