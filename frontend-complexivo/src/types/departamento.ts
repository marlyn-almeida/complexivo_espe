export type Estado01 = 0 | 1;

export interface Departamento {
  id_departamento: number;
  nombre_departamento: string;
  descripcion_departamento: string | null;
  estado: Estado01;
  created_at: string;
  updated_at: string | null;
}
