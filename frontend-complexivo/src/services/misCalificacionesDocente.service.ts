// ✅ src/services/misCalificacionesDocente.service.ts
import axiosClient from "../api/axiosClient";

// =========================
// TYPES (los que usa tu page)
// =========================
export type Nivel = {
  id_nivel: number;
  nombre_nivel: string;
  puntaje: number;
  descripcion?: string | null;
};

export type CriterioPlan = {
  id_criterio: number;
  nombre_criterio: string;
  descripcion_criterio?: string | null;

  niveles: Nivel[];

  // si backend devuelve ya seleccionado
  id_nivel_seleccionado?: number | null;
  observacion?: string | null;
};

export type ComponentePlan = {
  id_componente: number;
  nombre_componente: string;
  ponderacion?: number | null;
  criterios: CriterioPlan[];
};

export type ItemPlan = {
  id_item_plan: number;
  nombre_item: string;
  ponderacion?: number | null;

  rubrica_nombre?: string | null;
  componentes: ComponentePlan[];
};

export type SavePayload = {
  calificaciones: Array<{
    id_criterio: number;
    id_nivel: number;
    observacion?: string | null;
  }>;
  observacion_general?: string | null;
};

// =========================
// RESPONSE SHAPE (lo que tu page lee)
// =========================
export type MisCalificacionesDocenteResponse = {
  ok: boolean;
  data: {
    tribunal_estudiante: {
      id_tribunal_estudiante: number;
      estudiante: string;
      carrera?: string | null;
      mi_rol?: string | null;
      cerrado?: 0 | 1;
      // opcional
      id_estudiante?: number;
      id_tribunal?: number;
      fecha?: string | null;
      hora_inicio?: string | null;
      hora_fin?: string | null;
    };

    plan?: {
      id_plan?: number;
      nombre_plan?: string | null;
    } | null;

    items: ItemPlan[];

    observacion_general?: string | null;
  };
};

function unwrapResponse(res: any): MisCalificacionesDocenteResponse {
  // axios => {data: ...}
  const data = res?.data ?? res;

  // si ya viene {ok,data}
  if (data?.ok !== undefined) return data as MisCalificacionesDocenteResponse;

  // si viene {data:{...}} sin ok
  return { ok: true, data: (data?.data ?? data) as any };
}

export const misCalificacionesDocenteService = {
  // ✅ Backend real (según tu calificacion.service.ts):
  // GET /calificaciones/mis/:id_tribunal_estudiante
  get: async (id_tribunal_estudiante: number): Promise<MisCalificacionesDocenteResponse> => {
    const res = await axiosClient.get(`/calificaciones/mis/${id_tribunal_estudiante}`);
    return unwrapResponse(res);
  },

  // ✅ Backend real:
  // POST /calificaciones/mis/:id_tribunal_estudiante
  save: async (id_tribunal_estudiante: number, payload: SavePayload): Promise<MisCalificacionesDocenteResponse> => {
    const res = await axiosClient.post(`/calificaciones/mis/${id_tribunal_estudiante}`, payload);
    return unwrapResponse(res);
  },
};
