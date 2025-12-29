import axiosClient from "../api/axiosClient";

export type RubricaComponente = {
  id_rubrica_componente: number;
  id_rubrica: number;
  id_componente: number;               // ✅ catálogo
  ponderacion_porcentaje: number;
  orden_componente: number;
  estado?: boolean | number;

  // opcional si backend devuelve nombre:
  nombre_componente?: string;
};

export const rubricaComponenteService = {
  list: async (params?: { includeInactive?: boolean; rubricaId?: number }) => {
    const res = await axiosClient.get("/rubricas-componentes", { params });
    return res.data as RubricaComponente[];
  },

  create: async (payload: {
    id_rubrica: number;
    id_componente: number;             // ✅ catálogo
    ponderacion_porcentaje: number;
    orden_componente: number;
  }) => {
    const res = await axiosClient.post("/rubricas-componentes", payload);
    return res.data as RubricaComponente;
  },

  update: async (id: number, payload: {
    ponderacion_porcentaje: number;
    orden_componente: number;
  }) => {
    const res = await axiosClient.put(`/rubricas-componentes/${id}`, payload);
    return res.data as RubricaComponente;
  },

  changeEstado: async (id: number, estado: boolean) => {
    const res = await axiosClient.patch(`/rubricas-componentes/${id}/estado`, { estado });
    return res.data;
  },
};
