import axiosClient from "../api/axiosClient";

export type RubricaCriterioNivel = {
  id_rubrica_criterio_nivel: number;

  id_componente: number;   // ✅ catálogo componente
  id_criterio: number;     // ✅ catálogo criterio
  id_nivel: number;        // ✅ catálogo nivel

  descripcion: string;
  estado?: boolean | number;

  // opcional si backend devuelve nombres:
  nombre_criterio?: string;
  nombre_nivel?: string;
};

export const rubricaCriterioNivelService = {
  list: async (params?: { includeInactive?: boolean; componenteId?: number }) => {
    // ✅ componenteId = ID del catálogo componente
    const res = await axiosClient.get("/rubricas-criterios-niveles", { params });
    return res.data as RubricaCriterioNivel[];
  },

  create: async (payload: {
    id_componente: number; // ✅ catálogo componente
    id_criterio: number;
    id_nivel: number;
    descripcion: string;
  }) => {
    const res = await axiosClient.post("/rubricas-criterios-niveles", payload);
    return res.data as RubricaCriterioNivel;
  },

  update: async (id: number, payload: { descripcion: string }) => {
    const res = await axiosClient.put(`/rubricas-criterios-niveles/${id}`, payload);
    return res.data as RubricaCriterioNivel;
  },

  changeEstado: async (id: number, estado: boolean) => {
    const res = await axiosClient.patch(`/rubricas-criterios-niveles/${id}/estado`, { estado });
    return res.data;
  },
};
