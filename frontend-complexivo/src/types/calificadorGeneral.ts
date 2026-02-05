export type CalificadorGeneral = {
  id_calificador_general: number;
  id_carrera_periodo: number;
  id_carrera_docente: number;

  nombres_docente: string;
  apellidos_docente: string;

  estado: number;
};

export type CalificadorGeneralCreate = {
  id_carrera_docente: number;
};
