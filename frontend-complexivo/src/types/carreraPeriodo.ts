// src/types/carreraPeriodo.ts

// =========================
// RESUMEN POR PERIODO
// =========================
export interface PeriodoResumen {
  id_periodo: number;
  codigo_periodo: string;
  descripcion_periodo?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  total_asignadas: number | string;
}

// =========================
// ENTIDAD CARRERA_PERIODO
// =========================
export interface CarreraPeriodo {
  id_carrera_periodo: number;
  id_carrera: number;
  id_periodo: number;

  /**
   * Algunos endpoints devuelven cp.estado
   * otros estado_cp → soportamos ambos
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
   * Compatibilidad con páginas viejas
   */
  carrera_nombre?: string;
  periodo_nombre?: string;

  // =========================
  // Autoridades (flujo actual)
  // =========================
  id_docente_director?: number | null;
  id_docente_apoyo?: number | null;

  director_nombres?: string | null;
  director_apellidos?: string | null;

  apoyo_nombres?: string | null;
  apoyo_apellidos?: string | null;

  // (opcionales) cuando enriqueces cards con getAdmins()
  director?: any | null;
  apoyo?: any | null;
}

// =========================
// DTOs - BACKEND REAL (bulk/sync actuales)
// =========================

/**
 * ✅ Payload REAL que tu backend valida en:
 * POST  /carreras-periodos/bulk
 * PUT   /carreras-periodos/sync
 */
export interface CarreraPeriodoBulkIdsDTO {
  id_periodo: number;
  carreraIds: number[];
}

// =========================
// DTOs - FUTURO (si algún día mandas director/apoyo en el mismo POST)
// =========================

/**
 * Item por carrera (si luego implementas bulk con autoridades)
 */
export interface CarreraPeriodoBulkItemDTO {
  id_carrera: number;
  id_docente_director?: number | null;
  id_docente_apoyo?: number | null;
}

/**
 * Payload tipo items (NO lo uses con /bulk actual porque backend no lo valida)
 */
export interface CarreraPeriodoBulkDTO {
  id_periodo: number;
  items: CarreraPeriodoBulkItemDTO[];
}
