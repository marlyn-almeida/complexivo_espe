import axiosClient from "../api/axiosClient";
import type { Rubrica, TipoRubrica } from "../types/rubrica";

export type RubricaCreateDTO = {
  id_carrera_periodo: number;
  tipo_rubrica: TipoRubrica;
  ponderacion_global?: number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
};

export const rubricaService = {
  listByPeriodo: async (idCarreraPeriodo: number, includeInactive = false): Promise<Rubrica[]> => {
    const res = await axiosClient.get<Rubrica[]>("/rubricas", {
      params: {
        carreraPeriodoId: idCarreraPeriodo,
        includeInactive,
      },
    });
    return res.data ?? [];
  },

  create: async (payload: RubricaCreateDTO): Promise<Rubrica> => {
    const res = await axiosClient.post("/rubricas", payload);
    return res.data;
  },

  toggleEstado: async (id: number, estadoActual: 0 | 1): Promise<Rubrica> => {
    const res = await axiosClient.patch(`/rubricas/${id}/estado`, {
      estado: estadoActual === 1 ? 0 : 1,
    });
    return res.data;
  },
};
