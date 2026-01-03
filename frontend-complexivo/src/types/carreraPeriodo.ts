export interface PeriodoResumen {
  id_periodo: number;
  codigo_periodo: string;
  descripcion_periodo?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  total_asignadas: number | string;
}

export interface CarreraPeriodo {
  id_carrera_periodo: number;
  id_carrera: number;
  id_periodo: number;

  /**
   * Algunos endpoints te devuelven cp.estado
   * y el /list (según repo) suele devolver estado_cp.
   * Para no pelear con TS, soportamos ambos.
   */
  estado?: number | boolean;
  estado_cp?: number;

  // joins (backend)
  nombre_carrera?: string;
  codigo_carrera?: string;
  sede?: string;
  modalidad?: string;

  codigo_periodo?: string;
  descripcion_periodo?: string;
  fecha_inicio?: string;
  fecha_fin?: string;

  /**
   * ✅ Compatibilidad con páginas viejas
   * (Tu error viene de usar estos nombres)
   * Lo correcto es usar nombre_carrera y codigo_periodo.
   */
  carrera_nombre?: string;
  periodo_nombre?: string;
}

export type CarreraPeriodoBulkDTO = {
  id_periodo: number;
  carreraIds: number[];
};
