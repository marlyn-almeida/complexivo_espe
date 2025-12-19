export type Estado01 = 0 | 1;

export interface PeriodoAcademico {
  id_periodo: number;
  codigo_periodo: string;
  descripcion_periodo: string;
  fecha_inicio: string; // ISO
  fecha_fin: string;    // ISO
  estado: Estado01 | boolean; // por si el backend devuelve 0|1 o true/false
}
