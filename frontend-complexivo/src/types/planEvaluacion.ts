export type PlanEvaluacion = {
  id_plan_evaluacion: number;
  id_carrera_periodo: number;
  nombre_plan: string;
  descripcion_plan?: string | null;
  estado: 0 | 1;
  created_at?: string;
  updated_at?: string;
};

export type PlanEvaluacionCreate = {
  nombre_plan: string;
  descripcion_plan?: string | null;
};
