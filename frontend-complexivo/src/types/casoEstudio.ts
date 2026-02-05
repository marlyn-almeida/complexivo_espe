export type CasoEstudio = {
  id_caso_estudio: number;
  id_carrera_periodo: number;
  numero_caso: number;
  titulo?: string | null;
  descripcion?: string | null;

  archivo_nombre: string;
  archivo_path: string;

  estado: number;
  created_at: string;
};

export type CasoEstudioCreate = {
  numero_caso: number;
  titulo?: string;
  descripcion?: string;
  archivo: File;
};
