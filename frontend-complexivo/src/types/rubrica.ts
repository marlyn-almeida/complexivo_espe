// src/types/rubrica.ts

export interface Rubrica {
  id_rubrica: number;
  id_periodo: number;
  ponderacion_global: number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number | boolean;
  created_at?: string;
  updated_at?: string;
}

/** ✅ Para selects (opcional, si quieres más liviano) */
export type RubricaLite = Pick<Rubrica, "id_rubrica" | "nombre_rubrica" | "estado">;

/** ✅ componente de rúbrica */
export interface RubricaComponente {
  id_rubrica_componente: number;
  id_rubrica: number;
  nombre_componente: string;

  // 👇 en tu app tienes 2 “formatos” circulando:
  // - en types: ponderacion_pct
  // - en algunos services: ponderacion (number|string)
  // Para que NO se rompa, soportamos ambos.
  ponderacion_pct?: number; // 0..100 (interna)
  ponderacion?: number | string;

  estado: number | boolean;
  created_at?: string;
  updated_at?: string;
}

/** ✅ Lite para PlanEvaluacion (lo que necesitas para listar + distribuir) */
export type RubricaComponenteLite = Pick<
  RubricaComponente,
  "id_rubrica_componente" | "id_rubrica" | "nombre_componente" | "estado" | "ponderacion_pct" | "ponderacion"
>;
