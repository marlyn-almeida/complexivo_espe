export type PonderacionExamen = {
  id_config_ponderacion: number;
  id_carrera_periodo: number;

  peso_teorico_final_pct: number;
  peso_practico_final_pct: number;

  peso_practico_escrito_pct: number;
  peso_practico_oral_pct: number;

  estado: number;
};

export type PonderacionExamenUpdate = {
  peso_teorico_final_pct: number;
  peso_practico_final_pct: number;
  peso_practico_escrito_pct: number;
  peso_practico_oral_pct: number;
};
