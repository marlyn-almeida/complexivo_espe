import axiosClient from "../api/axiosClient";
import type { Tribunal } from "../types/tribunal";

export const misTribunalesService = {
  list: async (): Promise<Tribunal[]> => {
    const res = await axiosClient.get<Tribunal[]>("/tribunales/mis-tribunales");
    return res.data ?? [];
  },
};
