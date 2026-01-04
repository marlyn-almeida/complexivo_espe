// src/types/tribunal.ts
export type Estado01 = 0 | 1;

export interface Tribunal {
  id_tribunal: number;
  id_carrera_periodo: number;

  id_carrera_docente: number; // (según tu backend)
  caso?: number | null;

  nombre_tribunal: string | null;
  descripcion_tribunal?: string | null; // ✅

  estado: Estado01;

  created_at?: string;
  updated_at?: string | null;

  // joins (si vienen en list)
  nombre_carrera?: string;
  codigo_carrera?: string;
  codigo_periodo?: string;
}
