// src/types/tribunalEstudiante.ts
export type Estado01 = 0 | 1;

export interface TribunalEstudiante {
  id_tribunal_estudiante: number;
  id_tribunal: number;
  id_estudiante: number;
  id_franja_horario: number;

  estado: Estado01;

  created_at?: string;
  updated_at?: string | null;

  // joins (si tu repo los manda en list)
  nombres_estudiante?: string;
  apellidos_estudiante?: string;
  id_institucional_estudiante?: string;

  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  laboratorio?: string;
}
