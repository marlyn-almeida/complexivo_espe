import axiosClient from "../api/axiosClient";

export type RubricaCriterio = {
  id_rubrica_criterio: number;
  id_rubrica_componente: number;
  nombre_criterio: string;
  descripcion_criterio?: string;
  orden: number;
  estado?: boolean | number;
};

export const rubricaCriterioService = {
  // ✅ RUTA REAL (server.js):
  // protectedApi.use("/componentes/:componenteId/criterios", ...)
  list: async (componenteId: number, params?: { includeInactive?: boolean }) => {
    const res = await axiosClient.get(`/componentes/${componenteId}/criterios`, {
      params,
    });
    return res.data as RubricaCriterio[];
  },

  create: async (
    componenteId: number,
    payload: {
      nombre_criterio: string;
      descripcion_criterio?: string;
      orden: number;
    }
  ) => {
    const res = await axiosClient.post(
      `/componentes/${componenteId}/criterios`,
      payload
    );
    return res.data as RubricaCriterio;
  },

  update: async (
    componenteId: number,
    criterioId: number,
    payload: {
      nombre_criterio?: string;
      descripcion_criterio?: string;
      orden?: number;
    }
  ) => {
    const res = await axiosClient.put(
      `/componentes/${componenteId}/criterios/${criterioId}`,
      payload
    );
    return res.data as RubricaCriterio;
  },

  changeEstado: async (
    componenteId: number,
    criterioId: number,
    estado: boolean
  ) => {
    const res = await axiosClient.patch(
      `/componentes/${componenteId}/criterios/${criterioId}/estado`,
      { estado }
    );
    return res.data;
  },
};
