// src/types/calificacionDocente.ts

export type DesignacionTribunal = "PRESIDENTE" | "INTEGRANTE_1" | "INTEGRANTE_2";

export type PlanEvaluacion = {
  id_plan_evaluacion: number;
  id_carrera_periodo: number;
  nombre_plan?: string;
  estado: 0 | 1;
};

export type NivelRubrica = {
  id_rubrica_nivel: number;
  nombre_nivel: string;
  valor_nivel: number; // puntaje
  orden_nivel: number;
};

export type CriterioRubricaLite = {
  id_rubrica_criterio: number;
  nombre_criterio: string;
};

export type ComponenteRubricaLite = {
  id_rubrica_componente: number;
  nombre_componente: string;
  tipo_componente?: string | null; // si tu BD lo tiene
  criterios: CriterioRubricaLite[];
};

export type PlanItemTribunal = {
  id_plan_item: number;
  nombre_item: string;
  tipo_item: string;
  ponderacion_global_pct: number;
  calificado_por: "TRIBUNAL";
  id_rubrica: number;

  componentes: ComponenteRubricaLite[];
  niveles: NivelRubrica[]; // opciones para selects
};

export type CalificacionCriterioExistente = {
  id_plan_item: number;
  id_rubrica_componente: number;
  id_rubrica_criterio: number;
  id_rubrica_nivel: number;
  puntaje: number;
  observacion?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MisCalificacionesResponse = {
  ok: true;
  data: {
    plan: PlanEvaluacion;
    id_tribunal_estudiante: number;
    mi_designacion: DesignacionTribunal;
    cerrado: boolean;
    estructura: PlanItemTribunal[];
    existentes: CalificacionCriterioExistente[];
  };
};

export type GuardarCalificacionesPayload = {
  items: Array<{
    id_plan_item: number;
    id_rubrica_componente: number;
    criterios: Array<{
      id_rubrica_criterio: number;
      id_rubrica_nivel: number;
      observacion?: string | null;
    }>;
  }>;
};
