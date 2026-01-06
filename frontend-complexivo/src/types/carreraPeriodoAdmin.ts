// src/types/carreraPeriodoAdmin.ts
import type { AdminDocenteLite } from "./carreraAdmin";

export type CarreraPeriodoAdminsResponse = {
  id_carrera_periodo: number;
  director: AdminDocenteLite | null;
  apoyo: AdminDocenteLite | null;
};

export type CarreraPeriodoAdminsUpdateDTO = {
  id_docente_director?: number | null;
  id_docente_apoyo?: number | null;
};
