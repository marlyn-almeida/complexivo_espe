// src/types/tribunal.ts
export type Estado01 = 0 | 1;

export interface Tribunal {
  id_tribunal: number;
  id_carrera_periodo: number;

  nombre_tribunal: string;

  // ✅ opcional (si tu tabla lo tiene nullable)
  caso?: number | null;

  estado: Estado01;

  created_at?: string;
  updated_at?: string | null;

  // joins (si tu repo los manda en list)
  nombre_carrera?: string;
  codigo_carrera?: string;
  codigo_periodo?: string;
}
