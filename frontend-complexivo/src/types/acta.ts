// src/types/acta.ts

export type ActaEstado = "BORRADOR" | "GENERADA" | "FIRMADA";

export type Acta = {
  id_acta: number;
  id_calificacion: number;

  nota_teorico_20: number | null;
  nota_practico_escrita_20: number | null;
  nota_practico_oral_20: number | null;

  calificacion_final: number | null;
  calificacion_final_letras: string | null;

  aprobacion: 0 | 1 | null;
  fecha_acta: string | null; // YYYY-MM-DD

  estado_acta: ActaEstado;
  estado: 0 | 1;

  created_at?: string;
  updated_at?: string;
};

export type ActaGenerarRequest = {
  id_tribunal_estudiante: number;
  id_rubrica: number;
  fecha_acta?: string; // ISO o YYYY-MM-DD
  umbral_aprobacion?: number; // default 14
};

export type ActaArchivos = {
  plantilla: { id_plantilla: number; nombre: string } | null;
  docx: string | null; // "/uploads/actas/..."
  pdf: string | null;
};

export type ActaGenerarResponse = {
  acta: Acta;
  calculos: any;
  archivos: ActaArchivos;
};
