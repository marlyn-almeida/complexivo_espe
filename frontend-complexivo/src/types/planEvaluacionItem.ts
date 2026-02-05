export type TipoItemPlan = "NOTA_DIRECTA" | "CUESTIONARIO" | "RUBRICA";
export type CalificadoPor = "ROL2" | "TRIBUNAL" | "CALIFICADORES_GENERALES";

export type PlanEvaluacionItem = {
  id_plan_item: number;
  id_plan_evaluacion: number;

  nombre_item: string;
  tipo_item: TipoItemPlan;

  ponderacion_global_pct: number; // 0..100

  calificado_por: CalificadoPor; // para items NO rubrica (en rubrica se usa por componente)
  id_rubrica?: number | null;

  estado: 0 | 1;
  created_at?: string;
  updated_at?: string;
};

export type PlanEvaluacionItemCreate = {
  id_plan_evaluacion: number;
  nombre_item: string;
  tipo_item: TipoItemPlan;
  ponderacion_global_pct: number;
  calificado_por: CalificadoPor;
  id_rubrica?: number | null;
};

export type PlanEvaluacionItemPatch = Partial<{
  nombre_item: string;
  tipo_item: TipoItemPlan;
  ponderacion_global_pct: number;
  calificado_por: CalificadoPor;
  id_rubrica: number | null;
  estado: boolean;
}>;
