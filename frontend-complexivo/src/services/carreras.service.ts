import axiosClient from "../api/axiosClient";
import type { Carrera } from "../types/carrera";

export type CarreraCreateDTO = {
  nombre_carrera: string;
  sede: string;
  modalidad: string;
};

export type CarreraUpdateDTO = CarreraCreateDTO;

export const carrerasService = {
  // GET /carreras
  list: async (): Promise<Carrera[]> => {
    const res = await axiosClient.get<Carrera[]>("/carreras");
    return res.data;
  },

  // POST /carreras
  create: async (payload: CarreraCreateDTO) => {
    const res = await axiosClient.post("/carreras", payload);
    return res.data;
  },

  // PUT /carreras/:id
  update: async (id: number, payload: CarreraUpdateDTO) => {
    const res = await axiosClient.put(`/carreras/${id}`, payload);
    return res.data;
  },

  // PATCH /carreras/:id/estado
  toggleEstado: async (id: number) => {
    const res = await axiosClient.patch(`/carreras/${id}/estado`);
    return res.data;
  },
};
