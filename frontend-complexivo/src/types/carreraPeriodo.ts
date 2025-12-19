export interface CarreraPeriodo {
  id_carrera_periodo: number;

  id_carrera: number;
  id_periodo: number;

  // estos campos pueden venir del backend o no
  carrera_nombre?: string;
  periodo_nombre?: string;

  estado: boolean | number;
}
