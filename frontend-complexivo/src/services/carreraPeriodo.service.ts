import axiosClient from "../api/axiosClient";
import type { CarreraPeriodo } from "../types/carreraPeriodo";

export type CarreraPeriodoCreateDTO = {
  id_carrera: number;
  id_periodo: number;
};

export type CarreraPeriodoUpdateDTO = CarreraPeriodoCreateDTO;

export const carreraPeriodoService = {
  // 🔹 Obtener todas las asignaciones Carrera–Período (con filtros opcionales)
  list: async (params?: {
    includeInactive?: boolean;
    carreraId?: number | null;
    periodoId?: number | null;
  }): Promise<CarreraPeriodo[]> => {
    const res = await axiosClient.get<CarreraPeriodo[]>("/carreras-periodos", {
      params: params
        ? {
            includeInactive: params.includeInactive ? "true" : "false",
            carreraId: params.carreraId ?? undefined,
            periodoId: params.periodoId ?? undefined,
          }
        : undefined,
    });
    return res.data ?? [];
  },

  // 🔹 Crear una nueva asignación
  create: async (payload: CarreraPeriodoCreateDTO) => {
    const res = await axiosClient.post("/carreras-periodos", payload);
    return res.data;
  },

  // 🔹 Editar una asignación existente
  update: async (id: number, payload: CarreraPeriodoUpdateDTO) => {
    const res = await axiosClient.put(`/carreras-periodos/${id}`, payload);
    return res.data;
  },

  // 🔹 Activar / desactivar asignación (toggle REAL)
  // Necesita conocer el estado actual para invertirlo.
  toggleEstado: async (id: number, currentEstado: 0 | 1) => {
    const nuevoEstado: 0 | 1 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/carreras-periodos/${id}/estado`, {
      estado: nuevoEstado,
    });
    return res.data;
  },

  // (opcional) Setear estado directo si algún día lo necesitas
  setEstado: async (id: number, estado: 0 | 1) => {
    const res = await axiosClient.patch(`/carreras-periodos/${id}/estado`, { estado });
    return res.data;
  },
};
