import axiosClient from "../api/axiosClient";
import type { Nivel } from "../types/nivel";

export const nivelService = {
  list: async (params?: { includeInactive?: boolean }): Promise<Nivel[]> => {
    const res = await axiosClient.get<Nivel[]>("/niveles", {
      params: params
        ? { includeInactive: params.includeInactive ? "true" : "false" }
        : undefined,
    });
    return res.data ?? [];
  },
};
