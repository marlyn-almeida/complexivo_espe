export type Estado01 = 0 | 1;

export type Carrera = {
  id_carrera: number;
  nombre_carrera: string;
  codigo_carrera: string;
  descripcion_carrera?: string | null;
  id_departamento: number;
  estado: Estado01;
  sede?: string | null;
  modalidad?: string | null;
  created_at?: string;
  updated_at?: string | null;
};
