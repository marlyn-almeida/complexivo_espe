import axiosClient from "../api/axiosClient";
import type { Docente } from "../types/docente";

export type DocenteCreateDTO = {
  id_institucional_docente: string;
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;

  correo_docente?: string;      // ✅ opcional
  telefono_docente?: string;    // ✅ opcional
  nombre_usuario?: string;      // ✅ opcional (si lo generas)

  debe_cambiar_password?: 0 | 1;
};


export type DocenteUpdateDTO = Partial<DocenteCreateDTO>;

export const docentesService = {
  list: async (): Promise<Docente[]> => {
    const res = await axiosClient.get<Docente[]>("/docentes");
    return res.data ?? [];
  },

  create: async (payload: DocenteCreateDTO) => {
    const res = await axiosClient.post("/docentes", payload);
    return res.data;
  },

  update: async (id: number, payload: DocenteUpdateDTO) => {
    const res = await axiosClient.put(`/docentes/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: 0 | 1) => {
    const nuevo: 0 | 1 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/docentes/${id}/estado`, { estado: nuevo });
    return res.data;
  },
};
