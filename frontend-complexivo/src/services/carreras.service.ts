// src/services/carreras.service.ts
import axiosClient from "../api/axiosClient";
import type { Carrera, Estado01 } from "../types/carrera";

export type CarreraCreateDTO = {
  nombre_carrera: string;
  codigo_carrera: string;
  descripcion_carrera?: string;
  id_departamento: number;
  sede?: string;
  modalidad?: string;
};

export type CarreraUpdateDTO = Partial<CarreraCreateDTO>;

export const carrerasService = {
  // ✅ Trae TODO lo que el backend permite en 1 llamada (hasta 100)
 // src/services/carreras.service.ts
list: async (includeInactive = false): Promise<Carrera[]> => {
  const res = await axiosClient.get<Carrera[]>("/carreras", {
    params: { page: 1, limit: 100, includeInactive: includeInactive ? 1 : 0 },
  });
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
