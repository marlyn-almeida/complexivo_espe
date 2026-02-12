// ✅ src/types/misCalificacion.ts

export type MisCalificacionRow = {
  // ✅ clave real para saber si está asignado a tribunal
  id_tribunal_estudiante?: number | null;

  // tribunal
  id_tribunal: number;
  nombre_tribunal?: string | null;

  // estudiante
  id_estudiante: number;
  nombres_estudiante?: string | null;
  apellidos_estudiante?: string | null;
  id_institucional_estudiante?: string | null;

  // (compat)
  id_caso_estudio?: number | null;

  // ✅ NOTA TEÓRICA (ADMIN) - independiente del tribunal
  nota_teorico_20?: number | null;
  nota_teorico_observacion?: string | null;

  // entrega
  id_entrega?: number | null;
  entrega_archivo_nombre?: string | null;
  entrega_archivo_path?: string | null;
  entrega_fecha_entrega?: string | null;
  entrega_observacion?: string | null;
  entrega_estado?: number | null;

  // meta
  nombre_carrera?: string | null;
  codigo_periodo?: string | null;
  descripcion_periodo?: string | null;

  fecha_tribunal?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  estado_tribunal?: string | null;
  mi_rol?: string | null;
};
