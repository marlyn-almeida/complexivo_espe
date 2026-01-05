import axiosClient from "../api/axiosClient";

export type RubricaCriterioNivel = {
  id_rubrica_criterio_nivel: number;
  id_rubrica_criterio: number;
  id_rubrica_nivel: number;
  descripcion: string;
  nombre_nivel?: string;
  valor_nivel?: number;
  orden_nivel?: number;
  estado?: boolean | number;
};

export const rubricaCriterioNivelService = {
  list: async (criterioId: number, params?: { includeInactive?: boolean }) => {
    const res = await axiosClient.get(
      `/criterios/${criterioId}/niveles`,
      { params }
    );
    return res.data as RubricaCriterioNivel[];
  },

  upsert: async (
    criterioId: number,
    payload: {
      id_rubrica_nivel: number;
      descripcion?: string;
    }
  ) => {
    const res = await axiosClient.post(
      `/criterios/${criterioId}/niveles`,
      payload
    );
    return res.data as RubricaCriterioNivel;
  },

  changeEstado: async (
    criterioId: number,
    id: number,
    estado: boolean
  ) => {
    const res = await axiosClient.patch(
      `/criterios/${criterioId}/niveles/${id}/estado`,
      { estado }
    );
    return res.data;
  },
};
