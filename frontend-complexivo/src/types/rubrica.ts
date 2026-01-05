export interface Rubrica {
  id_rubrica: number;
  id_periodo: number;
  ponderacion_global: number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number | boolean;
  created_at?: string;
  updated_at?: string;
}
