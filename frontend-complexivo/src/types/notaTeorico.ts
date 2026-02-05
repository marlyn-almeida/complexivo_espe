export type NotaTeorico = {
  id_nota_teorico: number;
  id_estudiante: number;
  id_carrera_periodo: number;

  nota_teorico_20: number;
  observacion?: string | null;

  id_docente_registra: number;
  estado: number;
  created_at: string;
};

export type NotaTeoricoUpsert = {
  id_estudiante: number;
  nota_teorico_20: number;
  observacion?: string;
};
