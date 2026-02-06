import axiosClient from "../api/axiosClient";
import type { CarreraDocente } from "../types/carreraDocente";

export type CarreraDocenteListParams = {
  includeInactive?: boolean;
  docenteId?: number;
  carreraId?: number;
};

export type CarreraDocenteCreateDTO = {
  id_docente: number;
  id_carrera: number;
  tipo_admin?: "DIRECTOR" | "APOYO" | "DOCENTE";
};

export const carreraDocenteService = {
  list: async (params?: CarreraDocenteListParams): Promise<CarreraDocente[]> => {
    const res = await axiosClient.get<CarreraDocente[]>("/carreras-docentes", {
      params: {
        includeInactive: params?.includeInactive ? 1 : 0,
        docenteId: params?.docenteId,
        carreraId: params?.carreraId,
      },
    });
    return res.data ?? [];
  },

  // ✅ NUEVO (necesario para Calificadores/Tribunales)
  create: async (payload: CarreraDocenteCreateDTO) => {
    const res = await axiosClient.post("/carreras-docentes", payload);
    return res.data;
  },
};
