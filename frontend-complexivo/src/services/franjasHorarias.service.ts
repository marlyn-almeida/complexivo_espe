// src/services/franjaHorario.service.ts
import axiosClient from "../api/axiosClient";
import type { FranjaHorario, Estado01 } from "../types/franjaHoraria";

export type FranjaHorarioListParams = {
  carreraPeriodoId?: number;
  includeInactive?: boolean;
  fecha?: string; // YYYY-MM-DD
  q?: string; // opcional: para filtrar en front si quieres
  page?: number;
  limit?: number;
};

export type FranjaHorarioCreateDTO = {
  id_carrera_periodo: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  hora_fin: string; // HH:MM
  laboratorio: string;
};

export type FranjaHorarioUpdateDTO = FranjaHorarioCreateDTO;

export const franjaHorarioService = {
  list: async (params?: FranjaHorarioListParams): Promise<FranjaHorario[]> => {
    const limit = Math.min(params?.limit ?? 100, 100);

    const res = await axiosClient.get<FranjaHorario[]>("/franjas-horarias", {
      params: {
        carreraPeriodoId: params?.carreraPeriodoId,
        includeInactive: params?.includeInactive ? 1 : 0,
        fecha: params?.fecha || undefined,
        q: params?.q?.trim() || undefined,
        page: params?.page ?? 1,
        limit,
      },
    });

    return res.data ?? [];
  },

  get: async (id: number): Promise<FranjaHorario> => {
    const res = await axiosClient.get<FranjaHorario>(`/franjas-horarias/${id}`);
    return res.data;
  },

  create: async (payload: FranjaHorarioCreateDTO) => {
    const res = await axiosClient.post("/franjas-horarias", payload);
    return res.data;
  },

  update: async (id: number, payload: FranjaHorarioUpdateDTO) => {
    const res = await axiosClient.put(`/franjas-horarias/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: Estado01) => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/franjas-horarias/${id}/estado`, { estado: nuevo });
    return res.data;
  },
};
