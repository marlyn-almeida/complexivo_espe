export type Estado01 = 0 | 1;

export type TribunalDocenteDesignacion = "PRESIDENTE" | "INTEGRANTE_1" | "INTEGRANTE_2";

export interface TribunalDocente {
  id_tribunal_docente: number;
  id_tribunal: number;
  id_carrera_docente: number;
  designacion: TribunalDocenteDesignacion;
  estado: Estado01;

  // joins de docente
  id_docente?: number;
  nombres_docente?: string;
  apellidos_docente?: string;
}

export interface Tribunal {
  id_tribunal: number;
  id_carrera_periodo: number;

  // ✅ requerido en backend
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
  docentes?: TribunalDocente[];
}
