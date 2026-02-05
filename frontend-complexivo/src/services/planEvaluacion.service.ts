import axiosClient from "../api/axiosClient";
import type { PlanEvaluacion, PlanEvaluacionCreate } from "../types/planEvaluacion";

export const planEvaluacionService = {
  get: async (): Promise<PlanEvaluacion | null> => {
    const { data } = await axiosClient.get("/plan-evaluacion");
    return data;
  },

  create: async (payload: PlanEvaluacionCreate): Promise<PlanEvaluacion> => {
    const { data } = await axiosClient.post("/plan-evaluacion", payload);
    return data;
  },
};
