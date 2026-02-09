// ✅ src/types/misCalificacion.ts

export type MisCalificacionRow = {
  // ✅ clave real para saber si está asignado a tribunal (OBLIGATORIO en el nuevo modelo)
  id_tribunal_estudiante?: number | null;

  // tribunal
  id_tribunal: number;
  nombre_tribunal?: string | null;

  // estudiante
  id_estudiante: number;
  nombres_estudiante?: string | null;
  apellidos_estudiante?: string | null;
  id_institucional_estudiante?: string | null;

  // ✅ (ya NO se usa para entregas, lo dejamos solo por compat si aún llega del backend)
  id_caso_estudio?: number | null;

  // entrega (puede ser null si aún no hay)
  id_entrega?: number | null; // ✅ NUEVO recomendado
  entrega_archivo_nombre?: string | null;
  entrega_archivo_path?: string | null;
  entrega_fecha_entrega?: string | null;
  entrega_observacion?: string | null;
  entrega_estado?: number | null;

  // ✅ campos opcionales para que la tabla se parezca a tu screenshot
  nombre_carrera?: string | null;
  codigo_periodo?: string | null;
  descripcion_periodo?: string | null;

  fecha_tribunal?: string | null;      // "2026-02-08"
  hora_inicio?: string | null;         // "12:41"
  hora_fin?: string | null;            // "23:43"
  estado_tribunal?: string | null;     // "ABIERTO" / "CERRADO" (o lo que manejes)
  mi_rol?: string | null;              // "Director de Carrera" / "Docente de Apoyo" / "Vocal" etc.
};
