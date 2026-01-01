// src/services/carreraAdmin.service.ts
import axiosClient from "../api/axiosClient";
import type {
  CarreraAdminsResponse,
  CarreraAdminsUpdateDTO,
} from "../types/carreraAdmin";

export const carreraAdminService = {
  get: async (idCarrera: number): Promise<CarreraAdminsResponse> => {
    const res = await axiosClient.get<CarreraAdminsResponse>(
      `/carreras/${idCarrera}/admin`
    );
    return res.data;
  },

  update: async (
    idCarrera: number,
    payload: CarreraAdminsUpdateDTO
  ): Promise<CarreraAdminsResponse> => {
    const res = await axiosClient.put<CarreraAdminsResponse>(
      `/carreras/${idCarrera}/admin`,
      payload
    );
    return res.data;
  },
};
