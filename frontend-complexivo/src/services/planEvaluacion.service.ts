// src/services/planEvaluacion.service.ts
import axiosClient from "../api/axiosClient";
import type { PlanEvaluacion, PlanEvaluacionCreate } from "../types/planEvaluacion";
import type { PlanEvaluacionItem, PlanEvaluacionItemCreate, PlanEvaluacionItemPatch } from "../types/planEvaluacionItem";
import type { PlanItemRubricaCalificador } from "../types/planItemRubricaCalificador";

/**
 * IMPORTANTE:
 * - Backend toma el CP desde req.ctx.id_carrera_periodo
 * - req.ctx se llena con attachCarreraPeriodoCtx
 * - El CP llega desde header "x-carrera-periodo-id" (lo pone axiosClient interceptor)
 * - Por eso aquí NO enviamos params ni headers extra
 */
export const planEvaluacionService = {
  // ===== PLAN =====
  getByCP: async (): Promise<PlanEvaluacion | null> => {
    const { data } = await axiosClient.get("/plan-evaluacion");
    return (data?.data ?? null) as PlanEvaluacion | null;
  },

  create: async (payload: PlanEvaluacionCreate): Promise<number> => {
    const { data } = await axiosClient.post("/plan-evaluacion", payload);
    return Number(data?.id);
  },

  update: async (
    id_plan_evaluacion: number,
    patch: Partial<PlanEvaluacionCreate> & { estado?: boolean }
  ): Promise<void> => {
    await axiosClient.put(`/plan-evaluacion/${id_plan_evaluacion}`, patch);
  },

  // ===== ITEMS =====
  listItems: async (id_plan_evaluacion: number): Promise<PlanEvaluacionItem[]> => {
    const { data } = await axiosClient.get(`/plan-evaluacion/${id_plan_evaluacion}/items`);
    return (data?.data ?? []) as PlanEvaluacionItem[];
  },

  createItem: async (payload: PlanEvaluacionItemCreate): Promise<number> => {
    const { data } = await axiosClient.post("/plan-evaluacion/items", payload);
    return Number(data?.id);
  },

  updateItem: async (id_plan_item: number, patch: PlanEvaluacionItemPatch): Promise<void> => {
    await axiosClient.put(`/plan-evaluacion/items/${id_plan_item}`, patch);
  },

  // ===== COMPONENTE -> CALIFICADOR =====
  setComponentCalificador: async (payload: PlanItemRubricaCalificador): Promise<void> => {
    await axiosClient.post(`/plan-evaluacion/items/componentes/calificador`, payload);
  },

  listComponentCalificadores: async (id_plan_item: number): Promise<PlanItemRubricaCalificador[]> => {
    const { data } = await axiosClient.get(`/plan-evaluacion/items/${id_plan_item}/componentes/calificador`);
    return (data?.data ?? []) as PlanItemRubricaCalificador[];
  },
};
