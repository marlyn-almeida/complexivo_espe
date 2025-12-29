export type TipoRubrica = "ESCRITA" | "ORAL";

export interface Rubrica {
  id_rubrica: number;
  id_carrera_periodo: number;
  tipo_rubrica: TipoRubrica;
  ponderacion_global: number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number | boolean;
  created_at?: string;
}
