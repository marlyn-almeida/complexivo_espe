// src/types/tribunalDocente.ts
export type DesignacionTribunal = "PRESIDENTE" | "INTEGRANTE_1" | "INTEGRANTE_2";

export interface TribunalDocenteDTO {
  id_carrera_docente: number;
  designacion: DesignacionTribunal;
}
