// src/types/docente.ts
export type Estado01 = 0 | 1;

export interface Docente {
  id_docente: number;

  id_institucional_docente: string;
  cedula: string;

  nombres_docente: string;
  apellidos_docente: string;

  correo_docente?: string | null;
  telefono_docente?: string | null;

  nombre_usuario: string;
  debe_cambiar_password: Estado01;

  estado: Estado01;

  created_at?: string;
  updated_at?: string | null;

  // ✅ Solo se llena cuando viene del JOIN con carrera_docente (scope ADMIN)
  id_carrera_docente?: number | null;
}
