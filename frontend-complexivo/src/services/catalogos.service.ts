import axiosClient from "../api/axiosClient";

export type CatalogoItem = { id: number; nombre: string; estado?: boolean | number };

export const catalogosService = {
  componentes: async (params?: { includeInactive?: boolean }) => {
    const res = await axiosClient.get("/componentes", { params });
    return res.data as CatalogoItem[];
  },
  criterios: async (params?: { includeInactive?: boolean }) => {
    const res = await axiosClient.get("/criterios", { params });
    return res.data as CatalogoItem[];
  },
  niveles: async (params?: { includeInactive?: boolean }) => {
    const res = await axiosClient.get("/niveles", { params });
    return res.data as CatalogoItem[];
  },
};
