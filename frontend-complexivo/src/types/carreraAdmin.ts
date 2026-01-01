// src/types/carreraAdmin.ts

export type TipoAdmin = "DIRECTOR" | "APOYO";

export type AdminDocenteLite = {
  tipo_admin: TipoAdmin;
  id_docente: number;
  nombres_docente: string;
  apellidos_docente: string;
  nombre_usuario: string;
};

export type CarreraAdminsResponse = {
  id_carrera: number;
  director: AdminDocenteLite | null;
  apoyo: AdminDocenteLite | null;
};

export type CarreraAdminsUpdateDTO = {
  id_docente_director?: number | null;
  id_docente_apoyo?: number | null;
};
