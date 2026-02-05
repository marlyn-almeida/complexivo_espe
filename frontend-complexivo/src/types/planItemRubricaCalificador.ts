import type { CalificadoPor } from "./planEvaluacionItem";

export type PlanItemRubricaCalificador = {
  id_plan_item: number;
  id_rubrica_componente: number;
  calificado_por: CalificadoPor;
  estado?: 0 | 1;
};
