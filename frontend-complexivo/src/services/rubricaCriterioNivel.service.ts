import axiosClient from "../api/axiosClient";

export type RubricaCriterioNivelCreateDTO = {
  id_componente: number;
  id_criterio: number;
  id_nivel: number;
  descripcion: string;
};

export const rubricaCriterioNivelService = {
  create: async (payload: RubricaCriterioNivelCreateDTO) => {
    const res = await axiosClient.post("/rubricas-criterios-niveles", payload);
    return res.data;
  },
};
