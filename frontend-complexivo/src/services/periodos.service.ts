import axiosClient from "../api/axiosClient";
import type { PeriodoAcademico } from "../types/periodoAcademico";

export type PeriodoCreateDTO = {
  codigo_periodo: string;
  descripcion_periodo: string;
  fecha_inicio: string; // "YYYY-MM-DD" o ISO
  fecha_fin: string;
};

export type PeriodoUpdateDTO = PeriodoCreateDTO;

type PeriodosListParams = {
  includeInactive?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};

const toBool = (estado: PeriodoAcademico["estado"]): boolean => {
  if (typeof estado === "boolean") return estado;
  return estado === 1;
};

export const periodosService = {
  list: async (params?: PeriodosListParams): Promise<PeriodoAcademico[]> => {
    const res = await axiosClient.get<PeriodoAcademico[]>("/periodos", { params });
    return res.data ?? [];
  },

  create: async (payload: PeriodoCreateDTO) => {
    const res = await axiosClient.post("/periodos", payload);
    return res.data;
  },

  update: async (id: number, payload: PeriodoUpdateDTO) => {
    const res = await axiosClient.put(`/periodos/${id}`, payload);
    return res.data;
  },

  // ✅ backend espera boolean
  toggleEstado: async (id: number, currentEstado: PeriodoAcademico["estado"]) => {
    const current = toBool(currentEstado);
    const next = !current; // toggle
    const res = await axiosClient.patch(`/periodos/${id}/estado`, { estado: next });
    return res.data;
  },
};
