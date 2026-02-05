export type Estado01 = 0 | 1;

export interface Tribunal {
  id_tribunal: number;
  id_carrera_periodo: number;

  id_carrera_docente: number; // legacy: presidente
  caso?: number | null;

  // ✅ requerido en backend -> no debe ser null en TS
  nombre_tribunal: string;
  descripcion_tribunal?: string | null;

  estado: Estado01;

  created_at?: string;
  updated_at?: string | null;

  // joins
  nombre_carrera?: string;
  codigo_carrera?: string;
  codigo_periodo?: string;

  // opcional: si usas /tribunales/:id que retorna docentes
  docentes?: any[];
}
