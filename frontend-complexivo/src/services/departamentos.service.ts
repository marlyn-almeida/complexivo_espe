import axiosClient from "../api/axiosClient";

export type Departamento = {
  id_departamento: number;
  nombre_departamento: string;
  descripcion_departamento?: string | null;
  estado: 0 | 1;
  created_at?: string;
  updated_at?: string | null;
};

export const departamentosService = {
  list: async (): Promise<Departamento[]> => {
    const res = await axiosClient.get<Departamento[]>("/departamentos");
    return res.data ?? [];
  },
};
