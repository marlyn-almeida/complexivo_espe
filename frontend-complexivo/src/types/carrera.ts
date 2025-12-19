export type Estado01 = 0 | 1;

export interface Carrera {
  id_carrera: number;
  nombre_carrera: string;
  sede: string;
  modalidad: string;
  estado: Estado01 | boolean; // soporta ambos: BD 0/1 o backend boolean
  created_at?: string | null;
  updated_at?: string | null;
}
