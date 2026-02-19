// ✅ src/services/misCalificacionesDocente.service.ts
import axiosClient from "../api/axiosClient";

// =========================
// TYPES (según tu BACKEND real)
// =========================
export type Nivel = {
  id_rubrica_nivel: number;
  nombre_nivel: string;
  valor_nivel: number;
  orden_nivel?: number;
};

export type CriterioPlan = {
  id_rubrica_criterio: number;
  nombre_criterio: string;
};

export type ComponentePlan = {
  id_rubrica_componente: number;
  nombre_componente: string;
  tipo_componente?: string | null;
  criterios: CriterioPlan[];
};

export type ItemPlan = {
  id_plan_item: number;
  nombre_item: string;
  tipo_item?: string | null;
  ponderacion_global_pct?: number | null;
  calificado_por?: string | null;
  id_rubrica?: number | null;

  componentes: ComponentePlan[];
  niveles: Nivel[];
};

export type Existente = {
  id_plan_item: number;
  id_rubrica_componente: number;
  id_rubrica_criterio: number;
  id_rubrica_nivel: number;
  puntaje?: number;
  observacion?: string | null;
};

export type SavePayload = {
  items: Array<{
    id_plan_item: number;
    componentes: Array<{
      id_rubrica_componente: number;
      criterios: Array<{
        id_rubrica_criterio: number;
        id_rubrica_nivel: number;
        observacion?: string | null;
      }>;
    }>;
  }>;
};

export type MisCalificacionesDocenteResponse = {
  ok: boolean;
  data: {
    plan?: {
      id_plan_evaluacion: number;
      nombre_plan?: string | null;
    } | null;

    id_tribunal_estudiante: number;
    mi_designacion: string;
    cerrado: boolean | 0 | 1;

    estructura: ItemPlan[];
    existentes: Existente[];
  };
};

function unwrapResponse(res: any): MisCalificacionesDocenteResponse {
  const data = res?.data ?? res;

  // ya viene {ok,data}
  if (data && typeof data === "object" && "ok" in data && "data" in data) {
    return data as MisCalificacionesDocenteResponse;
  }

  // fallback
  return { ok: true, data: (data?.data ?? data) as any };
}

export const misCalificacionesDocenteService = {
  // ✅ GET /calificaciones/mis/:id_tribunal_estudiante
  get: async (id_tribunal_estudiante: number): Promise<MisCalificacionesDocenteResponse> => {
    const res = await axiosClient.get(`/calificaciones/mis/${id_tribunal_estudiante}`);
    return unwrapResponse(res);
  },

  // ✅ POST /calificaciones/mis/:id_tribunal_estudiante
  save: async (id_tribunal_estudiante: number, payload: SavePayload): Promise<MisCalificacionesDocenteResponse> => {
    const res = await axiosClient.post(`/calificaciones/mis/${id_tribunal_estudiante}`, payload);
    return unwrapResponse(res);
  },
};
