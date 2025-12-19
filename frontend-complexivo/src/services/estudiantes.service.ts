import axiosClient from "../api/axiosClient";
import type { Estudiante } from "../types/estudiante";

export type EstudianteCreateDTO = {
  cedula: string;
  nombres: string;
  apellidos: string;
  id_carrera_periodo: number;
};

export type EstudianteUpdateDTO = EstudianteCreateDTO;

export const estudiantesService = {
  listByCarreraPeriodo: async (idCarreraPeriodo: number): Promise<Estudiante[]> => {
    const res = await axiosClient.get<Estudiante[]>(
      `/estudiantes?carreraPeriodoId=${idCarreraPeriodo}`
    );
    return res.data;
  },

  create: async (payload: EstudianteCreateDTO) => {
    const res = await axiosClient.post("/estudiantes", payload);
    return res.data;
  },

  update: async (id: number, payload: EstudianteUpdateDTO) => {
    const res = await axiosClient.put(`/estudiantes/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number) => {
    const res = await axiosClient.patch(`/estudiantes/${id}/estado`);
    return res.data;
  },
};
