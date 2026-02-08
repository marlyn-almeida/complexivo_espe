// ✅ src/types/misCalificacion.ts
export type MisCalificacionRow = {
  id_tribunal: number;
  nombre_tribunal?: string | null;

  id_estudiante: number;
  nombres_estudiante?: string | null;
  apellidos_estudiante?: string | null;
  id_institucional_estudiante?: string | null;

  id_caso_estudio?: number | null;

  id_estudiante_caso_entrega?: number | null;
  entrega_archivo_nombre?: string | null;
  entrega_archivo_path?: string | null;
  entrega_fecha_entrega?: string | null;
  entrega_observacion?: string | null;
  entrega_estado?: number | null;
};
