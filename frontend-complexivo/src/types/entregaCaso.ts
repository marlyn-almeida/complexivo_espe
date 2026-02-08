// src/types/entregaCaso.ts
export type Estado01 = 0 | 1;

export type EntregaCaso = {
  // ✅ OJO: tu backend puede tener uno de estos nombres
  // dejamos ambos opcionales para que no reviente si cambia el nombre exacto
  id_entrega_caso?: number;
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

  // joins opcionales (si backend devuelve)
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
