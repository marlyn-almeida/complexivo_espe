// src/types/tribunalEstudiante.ts
export type Estado01 = 0 | 1;

export interface TribunalEstudiante {
  id_tribunal_estudiante: number;
  id_tribunal: number;
  id_estudiante: number;
  id_franja_horario: number;

  // ✅ NUEVO (DB): caso asignado en el tribunal_estudiante
  id_caso_estudio: number;

  // estado del registro (activo/inactivo)
  estado: Estado01;

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
  numero_caso?: number;
  titulo_caso?: string | null;

  // joins carrera/periodo (list)
  nombre_carrera?: string;
  codigo_periodo?: string;

  // opcional (agenda rol 3)
  designacion?: string;
}
