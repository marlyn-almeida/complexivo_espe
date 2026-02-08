// src/types/entregaCaso.ts
export type Estado01 = 0 | 1;

export type EntregaCaso = {
  // (si tu DB devuelve id interno)
  id_estudiante_caso_entrega?: number;

  id_estudiante: number;
  id_caso_estudio: number;

  archivo_nombre: string;
  archivo_path: string;

  fecha_entrega?: string | null;
  observacion?: string | null;

  estado: Estado01;

  created_at?: string;
  updated_at?: string | null;

  // joins opcionales
  numero_caso?: number | string | null;
  titulo_caso?: string | null;

  nombres_estudiante?: string;
  apellidos_estudiante?: string;
  id_institucional_estudiante?: string;
};

export type EntregaCasoCreateDTO = {
  id_estudiante: number;
  id_caso_estudio: number;
  archivo: File;
  observacion?: string;
};
