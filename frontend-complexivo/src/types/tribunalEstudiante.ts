// src/types/tribunalEstudiante.ts
export type Estado01 = 0 | 1;

export interface TribunalEstudiante {
  id_tribunal_estudiante: number;
  id_tribunal: number;
  id_estudiante: number;
  id_franja_horario: number;

  // estado del registro (activo/inactivo)
  estado: Estado01;

  // ✅ NUEVO: estado académico de la defensa
  // 0 = ABIERTA, 1 = CERRADA
  cerrado: Estado01;
  fecha_cierre?: string | null; // DATETIME
  id_docente_cierra?: number | null;

  created_at?: string;
  updated_at?: string | null;

  // joins estudiante
  nombres_estudiante?: string;
  apellidos_estudiante?: string;
  id_institucional_estudiante?: string;

  // joins franja
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  laboratorio?: string;

  // joins caso (si backend lo incluye)
  id_caso_estudio?: number;
  numero_caso?: number;
  titulo_caso?: string | null;

  // opcional (agenda rol 3)
  designacion?: string;
}
