// ✅ src/services/calificacionesDocente.service.ts (CORREGIDO)
// Este archivo reemplaza al viejo que usaba /mis-calificaciones/:id
// Ahora usa el endpoint correcto del backend: /calificaciones/mis/:id_tribunal_estudiante
// y define tipos + payload según tu calificacion.routes.js + calificacion.service.js

import axiosClient from "../api/axiosClient";

/* =========================
   TIPOS alineados al BACKEND
   ========================= */

export type RubricaNivel = {
  id_rubrica_nivel: number;
  nombre_nivel: string;
  valor_nivel: number;
  orden_nivel: number;
};

export type RubricaCriterio = {
  id_rubrica_criterio: number;
  nombre_criterio: string;
};

export type RubricaComponente = {
  id_rubrica_componente: number;
  nombre_componente: string;
  tipo_componente: "ESCRITA" | "ORAL" | "OTRO" | string;
  criterios: RubricaCriterio[];
};

export type PlanItemEstructura = {
  id_plan_item: number;
  nombre_item: string;
  tipo_item: "NOTA_DIRECTA" | "RUBRICA" | string;
  ponderacion_global_pct: number;
  calificado_por: "ROL2" | "TRIBUNAL" | "CALIFICADORES_GENERALES" | string;
  id_rubrica: number | null;

  // viene del repo.getEstructuraParaDocente()
  componentes: RubricaComponente[];
  niveles: RubricaNivel[];
};

export type CalificacionExistenteDocente = {
  id_plan_item: number;
  id_rubrica_componente: number;
  id_rubrica_criterio: number;
  id_rubrica_nivel: number;
  puntaje: number;
  observacion: string | null;
  updated_at?: string;
  created_at?: string;
};

export type MisCalificacionesResponse = {
  ok: true;
  data: {
    plan: any;
    id_tribunal_estudiante: number;

    mi_designacion: "PRESIDENTE" | "INTEGRANTE_1" | "INTEGRANTE_2" | string;
    cerrado: boolean;

    // ✅ para PDFs
    id_estudiante: number | null;
    id_caso_estudio: number | null;

    estructura: PlanItemEstructura[];
    existentes: CalificacionExistenteDocente[];
  };
};

/* =========================
   PAYLOAD alineado al BACKEND
   ========================= */

export type GuardarCriterioPayload = {
  id_rubrica_criterio: number;
  id_rubrica_nivel: number;
  observacion?: string | null;
};

export type GuardarComponentePayload = {
  id_rubrica_componente: number;
  criterios: GuardarCriterioPayload[];
};

export type GuardarItemPayload = {
  id_plan_item: number;
  componentes: GuardarComponentePayload[];
};

export type GuardarMisCalificacionesPayload = {
  items: GuardarItemPayload[];
};

/* =========================
   SERVICE
   ========================= */

export const misCalificacionesDocenteService = {
  async get(idTribunalEstudiante: number): Promise<MisCalificacionesResponse> {
    const { data } = await axiosClient.get(`/calificaciones/mis/${Number(idTribunalEstudiante)}`);
    return data;
  },

  async save(
    idTribunalEstudiante: number,
    payload: GuardarMisCalificacionesPayload
  ): Promise<MisCalificacionesResponse> {
    const { data } = await axiosClient.post(
      `/calificaciones/mis/${Number(idTribunalEstudiante)}`,
      payload
    );
    return data;
  },
};

export default misCalificacionesDocenteService;