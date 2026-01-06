import axiosClient from "../api/axiosClient";

export type RubricaNivel = {
  id_rubrica_nivel: number;
  id_rubrica: number;
  nombre_nivel: string;
  valor_nivel: number;
  orden: number;
  estado?: boolean | number;
};

export const rubricaNivelService = {
  // ✅ RUTA REAL (server.js):
  // protectedApi.use("/rubricas/:rubricaId/niveles", ...)
  list: async (rubricaId: number, params?: { includeInactive?: boolean }) => {
    const res = await axiosClient.get(`/rubricas/${rubricaId}/niveles`, {
      params,
    });
    return res.data as RubricaNivel[];
  },

  create: async (
    rubricaId: number,
    payload: {
      nombre_nivel: string;
      valor_nivel: number;
      orden: number;
    }
  ) => {
    const res = await axiosClient.post(`/rubricas/${rubricaId}/niveles`, payload);
    return res.data as RubricaNivel;
  },

  update: async (
    rubricaId: number,
    nivelId: number,
    payload: {
      nombre_nivel?: string;
      valor_nivel?: number;
      orden?: number;
    }
  ) => {
    const res = await axiosClient.put(
      `/rubricas/${rubricaId}/niveles/${nivelId}`,
      payload
    );
    return res.data as RubricaNivel;
  },

  changeEstado: async (
    rubricaId: number,
    nivelId: number,
    estado: boolean
  ) => {
    const res = await axiosClient.patch(
      `/rubricas/${rubricaId}/niveles/${nivelId}/estado`,
      { estado }
    );
    return res.data;
  },
};
