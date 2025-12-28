export interface CarreraPeriodo {
  id_carrera_periodo: number;

  id_carrera: number;
  id_periodo: number;

  estado: boolean | number;

  // Campos que vienen del JOIN del backend (opcional)
  nombre_carrera?: string;
  codigo_carrera?: string;
  sede?: string;
  modalidad?: string;

  codigo_periodo?: string;
  descripcion_periodo?: string;
  fecha_inicio?: string; // "YYYY-MM-DD"
  fecha_fin?: string;    // "YYYY-MM-DD"

  created_at?: string;
  updated_at?: string;
}

// Para crear 1 relación
export type CarreraPeriodoCreateDTO = {
  id_carrera: number;
  id_periodo: number;
};

// Para bulk (varias carreras para 1 periodo)
export type CarreraPeriodoBulkCreateDTO = {
  id_periodo: number;
  carreraIds: number[];
};
