export type PlanEvaluacion = {
  id_plan_evaluacion: number;
  id_carrera_periodo: number;

  nombre: string;
  descripcion?: string | null;

  estado: number;
  created_at: string;
};

export type PlanEvaluacionCreate = {
  nombre: string;
  descripcion?: string;
};
