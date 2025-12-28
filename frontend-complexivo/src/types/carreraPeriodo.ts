export interface CarreraPeriodo {
  id_carrera_periodo: number;
  id_carrera: number;
  id_periodo: number;
  estado: boolean | number;

  nombre_carrera?: string;
  codigo_carrera?: string;
  sede?: string;
  modalidad?: string;

  codigo_periodo?: string;
  descripcion_periodo?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface PeriodoResumen {
  id_periodo: number;
  codigo_periodo?: string;
  descripcion_periodo?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  total_asignadas: number;
}

export type CarreraPeriodoBulkDTO = {
  id_periodo: number;
  carreraIds: number[];
};
