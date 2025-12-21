import axiosClient from "../api/axiosClient";
import type { Departamento } from "../types/departamento";

export const departamentosService = {
  list: async (): Promise<Departamento[]> => {
    const res = await axiosClient.get<Departamento[]>("/departamentos");
    return res.data ?? [];
  },
};
