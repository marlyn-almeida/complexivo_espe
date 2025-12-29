import axiosClient from "../api/axiosClient";

export type TipoRubrica = "ESCRITA" | "ORAL";

export type Rubrica = {
  id_rubrica: number;
  id_carrera_periodo: number;
  tipo_rubrica: TipoRubrica;
  ponderacion_global?: number;
  nombre_rubrica: string;
  descripcion_rubrica?: string;
  estado?: boolean | number;
};

export const rubricaService = {
  list: async (params?: { includeInactive?: boolean; carreraPeriodoId?: number }) => {
    const res = await axiosClient.get("/rubricas", { params });
    return res.data as Rubrica[];
  },

  create: async (payload: {
    id_carrera_periodo: number;
    tipo_rubrica: TipoRubrica;
    ponderacion_global?: number;
    nombre_rubrica: string;
    descripcion_rubrica?: string;
  }) => {
    const res = await axiosClient.post("/rubricas", payload);
    return res.data as Rubrica;
  },

  update: async (id: number, payload: {
    id_carrera_periodo: number;
    tipo_rubrica: TipoRubrica;
    ponderacion_global?: number;
    nombre_rubrica: string;
    descripcion_rubrica?: string;
  }) => {
    const res = await axiosClient.put(`/rubricas/${id}`, payload);
    return res.data as Rubrica;
  },

  changeEstado: async (id: number, estado: boolean) => {
    const res = await axiosClient.patch(`/rubricas/${id}/estado`, { estado });
    return res.data;
  },
};
