// ✅ src/services/misCalificacionesDocente.service.ts
import axiosClient from "../api/axiosClient";

/* ===== Tipos ===== */
export type Nivel = {
  id_nivel: number;
  nombre_nivel: string;
  puntaje: number;
  descripcion?: string | null;
};

export type Criterio = {
  id_criterio: number;
  nombre_criterio: string;
  descripcion_criterio?: string | null;
  niveles: Nivel[];

  id_nivel_seleccionado?: number | null;
  observacion?: string | null;
};

export type Componente = {
  id_componente: number;
  nombre_componente: string;
  ponderacion?: number | null;
  criterios: Criterio[];
};

export type ItemPlan = {
  id_item_plan: number;
  nombre_item: string;
  ponderacion?: number | null;
  rubrica_nombre?: string | null;
  componentes: Componente[];
};

export type MisCalificacionesResponse = {
  ok: true;
  data: {
    tribunal_estudiante: {
      id_tribunal_estudiante: number;
      estudiante: string;
      carrera?: string | null;
      cerrado?: 0 | 1;
      mi_rol?: string | null;
    };
    plan: {
      id_plan_evaluacion: number;
      nombre_plan: string;
    };
    items: ItemPlan[];
    observacion_general?: string | null;
  };
};

export type SavePayload = {
  calificaciones: Array<{
    id_criterio: number;
    id_nivel: number;
    observacion?: string | null;
  }>;
  observacion_general?: string | null;
};

/* ===== ✅ EXPORT NAMED (lo que tu page importa) ===== */
export const misCalificacionesDocenteService = {
  async get(idTribunalEstudiante: number): Promise<MisCalificacionesResponse> {
    const { data } = await axiosClient.get(`/mis-calificaciones/${idTribunalEstudiante}`);
    return data;
  },

  async save(
    idTribunalEstudiante: number,
    payload: SavePayload
  ): Promise<{ ok: true; message?: string }> {
    const { data } = await axiosClient.post(`/mis-calificaciones/${idTribunalEstudiante}`, payload);
    return data;
  },
};

/* ===== ✅ EXPORT DEFAULT (opcional, por si alguna vez importas sin llaves) ===== */
export default misCalificacionesDocenteService;
