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

/** ✅ NUEVO: componente de rúbrica (para distribución 50/50, etc.) */
export interface RubricaComponente {
  id_rubrica_componente: number;
  id_rubrica: number;
  nombre_componente: string;
  ponderacion_pct: number; // 0..100 (interna)
  estado: number | boolean;
  created_at?: string;
  updated_at?: string;
}
