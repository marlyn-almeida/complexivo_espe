// src/types/estudiante.ts
export type Estado01 = 0 | 1;

export interface Estudiante {
  id_estudiante: number;

  id_carrera_periodo: number;

  // "username" conceptual (según lo que me dijiste)
  id_institucional_estudiante: string;

  // ✅ nuevo
  cedula: string;

  nombres_estudiante: string;
  apellidos_estudiante: string;

  correo_estudiante?: string | null;
  telefono_estudiante?: string | null;

  estado: Estado01;

  created_at?: string;
  updated_at?: string | null;

  // joins (si tu repo los manda en list)
  id_carrera?: number;
  nombre_carrera?: string;
  codigo_carrera?: string;

  id_periodo?: number;
  codigo_periodo?: string;
}
