import axiosClient from "../api/axiosClient";
import type { PlanEvaluacion, PlanEvaluacionCreate } from "../types/planEvaluacion";
import type {
  PlanEvaluacionItem,
  PlanEvaluacionItemCreate,
  PlanEvaluacionItemPatch,
} from "../types/planEvaluacionItem";
import type { PlanItemRubricaCalificador } from "../types/planItemRubricaCalificador";

const CP_HEADER = "x-id-carrera-periodo"; // ✅ cambia si tu middleware usa otro header

export const planEvaluacionService = {
  // ===== PLAN =====
  getByCP: async (carreraPeriodoId: number): Promise<PlanEvaluacion | null> => {
    const { data } = await axiosClient.get("/plan-evaluacion", {
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
    });
    return (data?.data ?? null) as PlanEvaluacion | null;
  },

  create: async (carreraPeriodoId: number, payload: PlanEvaluacionCreate): Promise<number> => {
    const { data } = await axiosClient.post("/plan-evaluacion", payload, {
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
    });
    return Number(data?.id);
  },

  update: async (
    carreraPeriodoId: number,
    id_plan_evaluacion: number,
    patch: Partial<PlanEvaluacionCreate> & { estado?: boolean }
  ): Promise<void> => {
    await axiosClient.put(`/plan-evaluacion/${id_plan_evaluacion}`, patch, {
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
    });
  },

  // ===== ITEMS =====
  listItems: async (carreraPeriodoId: number, id_plan_evaluacion: number): Promise<PlanEvaluacionItem[]> => {
    const { data } = await axiosClient.get(`/plan-evaluacion/${id_plan_evaluacion}/items`, {
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
    });
    return (data?.data ?? []) as PlanEvaluacionItem[];
  },

  createItem: async (carreraPeriodoId: number, payload: PlanEvaluacionItemCreate): Promise<number> => {
    const { data } = await axiosClient.post("/plan-evaluacion/items", payload, {
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
    });
    return Number(data?.id);
  },

  updateItem: async (carreraPeriodoId: number, id_plan_item: number, patch: PlanEvaluacionItemPatch): Promise<void> => {
    await axiosClient.put(`/plan-evaluacion/items/${id_plan_item}`, patch, {
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
    });
  },

  // ===== COMPONENTE -> CALIFICADOR =====
  setComponentCalificador: async (carreraPeriodoId: number, payload: PlanItemRubricaCalificador): Promise<void> => {
    await axiosClient.post(`/plan-evaluacion/items/componentes/calificador`, payload, {
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
    });
  },

  listComponentCalificadores: async (carreraPeriodoId: number, id_plan_item: number): Promise<PlanItemRubricaCalificador[]> => {
    const { data } = await axiosClient.get(`/plan-evaluacion/items/${id_plan_item}/componentes/calificador`, {
      headers: { [CP_HEADER]: String(carreraPeriodoId) },
    });
    return (data?.data ?? []) as PlanItemRubricaCalificador[];
  },
};
