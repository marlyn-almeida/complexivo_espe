export type Estado01 = 0 | 1;

export type RolLite = {
  id_rol: number;
  nombre_rol: string;
};

export type PerfilDocente = {
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
};

export type PerfilMeResponse = {
  docente: PerfilDocente;
  roles: RolLite[];
  activeRole?: number | null;
};

export type ChangePasswordDTO = {
  newPassword: string;
  confirmPassword: string;
};
