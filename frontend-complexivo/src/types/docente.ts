export type Estado01 = 0 | 1;

export interface Docente {
  id_docente: number;

  id_institucional_docente: string;
  cedula: string;

  nombres_docente: string;
  apellidos_docente: string;

  correo_docente?: string | null;     // ✅ puede ser NULL
  telefono_docente?: string | null;   // ✅ puede ser NULL

  nombre_usuario: string;
  password: string;                   // si tu API NO devuelve password, lo quitamos (te explico abajo)
  debe_cambiar_password: Estado01;

  estado: Estado01;

  created_at?: string;
  updated_at?: string | null;
}
