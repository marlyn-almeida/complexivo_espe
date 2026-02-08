// src/types/casoEstudio.ts
export type Estado01 = 0 | 1;

export type CasoEstudio = {
  id_caso_estudio: number;
  id_carrera_periodo: number;

  numero_caso: number;
  titulo?: string | null;
  descripcion?: string | null;

  archivo_nombre: string;
  archivo_path: string;

  estado: Estado01;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CasoEstudioCreateDTO = {
  id_carrera_periodo: number;
  numero_caso: number;
  titulo?: string;
  descripcion?: string;
  archivo: File; // obligatorio al crear
};

export type CasoEstudioUpdateDTO = {
  numero_caso: number;
  titulo?: string;
  descripcion?: string;
  archivo?: File | null; // opcional al editar
};
