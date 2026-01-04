// src/types/carreraDocente.ts
export type Estado01 = 0 | 1;

export interface CarreraDocente {
  id_carrera_docente: number;
  id_docente: number;
  id_carrera_periodo: number;

  estado: Estado01;

  // joins que tu repo manda
  nombres_docente: string;
  apellidos_docente: string;
  id_institucional_docente: string;

  nombre_carrera?: string;
  codigo_carrera?: string;
  codigo_periodo?: string;

  created_at?: string;
  updated_at?: string | null;
}
