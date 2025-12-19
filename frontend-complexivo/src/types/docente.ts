export interface Docente {
  id_docente: number;
  id_institucional_docente: string;
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;
  correo_docente: string;
  telefono_docente: string;
  nombre_usuario: string;
  debe_cambiar_password: number;
  estado: 0 | 1;
  created_at?: string;
  updated_at?: string | null;
}
