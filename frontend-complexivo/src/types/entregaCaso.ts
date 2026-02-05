// src/types/entregaCaso.ts

export type EntregaCaso = {
  id_estudiante_caso_entrega: number;
  id_estudiante: number;
  id_caso_estudio: number;

  archivo_nombre: string;
  archivo_path: string;

  fecha_entrega?: string | null;
  observacion?: string | null;

  estado: number;
  created_at: string;
};

export type EntregaCasoCreate = {
  id_estudiante: number; // ✅ NUEVO
  id_caso_estudio: number;
  archivo: File;
  observacion?: string;
};

