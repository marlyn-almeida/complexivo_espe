import axiosClient from "../api/axiosClient";

export interface RubricaComponente {
  id_rubrica_componente: number;
  id_rubrica: number;
  id_componente: number;
  nombre_componente?: string;
  ponderacion_porcentaje: number;
  orden_componente: number;
  estado: number | boolean;
}

export type RubricaComponenteCreateDTO = {
  id_rubrica: number;
  id_componente: number;
  ponderacion_porcentaje: number;
  orden_componente: number;
};

export type RubricaComponenteUpdateDTO = {
  ponderacion_porcentaje: number;
  orden_componente: number;
};

export const rubricaComponenteService = {
  list: async (params: {
    rubricaId: number;
    includeInactive?: boolean;
  }): Promise<RubricaComponente[]> => {
    const res = await axiosClient.get<RubricaComponente[]>("/rubricas-componentes", {
      params: {
        rubricaId: params.rubricaId,
        includeInactive: params.includeInactive ? "true" : "false",
      },
    });

    return res.data ?? [];
  },

  create: async (payload: RubricaComponenteCreateDTO): Promise<RubricaComponente> => {
    const res = await axiosClient.post("/rubricas-componentes", payload);
    return res.data;
  },

  update: async (id: number, payload: RubricaComponenteUpdateDTO): Promise<RubricaComponente> => {
    const res = await axiosClient.put(`/rubricas-componentes/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number, estadoActual: 0 | 1): Promise<RubricaComponente> => {
    const nuevoEstado: 0 | 1 = estadoActual === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/rubricas-componentes/${id}/estado`, {
      estado: nuevoEstado,
    });
    return res.data;
  },
};
