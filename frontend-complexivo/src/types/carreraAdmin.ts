// src/types/carreraAdmin.ts
export type TipoAdmin = "DIRECTOR" | "APOYO";

export type AdminDocenteLite = {
  tipo_admin: TipoAdmin;
  id_docente: number;
  nombres_docente: string;
  apellidos_docente: string;
  nombre_usuario: string;
};

export type CarreraPeriodoAdminsResponse = {
  id_carrera_periodo: number;
  director: AdminDocenteLite | null;
  apoyo: AdminDocenteLite | null;
};

export type CarreraPeriodoAdminsUpdateDTO = {
  id_docente_director?: number | null;
  id_docente_apoyo?: number | null;
};
