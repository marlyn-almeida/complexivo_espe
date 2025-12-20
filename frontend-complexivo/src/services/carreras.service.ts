import axiosClient from "../api/axiosClient";
import type { Carrera, Estado01 } from "../types/carrera";

export type CarreraCreateDTO = {
  nombre_carrera: string;
  codigo_carrera: string;
  descripcion_carrera?: string | null;
  id_departamento: number;
  sede: string;       // lo vamos a exigir desde UI
  modalidad: string;  // "En línea" | "Presencial"
};

export type CarreraUpdateDTO = Partial<CarreraCreateDTO>;

export const carrerasService = {
  list: async (): Promise<Carrera[]> => {
    const res = await axiosClient.get<Carrera[]>("/carreras");
    return res.data ?? [];
  },

  create: async (payload: CarreraCreateDTO) => {
    const res = await axiosClient.post("/carreras", payload);
    return res.data;
  },

  update: async (id: number, payload: CarreraUpdateDTO) => {
    const res = await axiosClient.put(`/carreras/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: Estado01) => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/carreras/${id}/estado`, { estado: nuevo });
    return res.data;
  },
};
