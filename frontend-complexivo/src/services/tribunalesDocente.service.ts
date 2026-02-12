// ✅ src/services/tribunalesDocente.service.ts
import axiosClient from "../api/axiosClient";

export type MiTribunalItem = {
  id_tribunal_estudiante: number;
  id_tribunal: number;
  id_estudiante: number;

  estudiante: string;
  carrera?: string | null;
  fecha?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;

  cerrado?: 0 | 1;
};

function pickArray(x: any): any[] | null {
  return Array.isArray(x) ? x : null;
}

function unwrapArray(res: any): MiTribunalItem[] {
  const data = res?.data ?? res;
  return (
    pickArray(data) ||
    pickArray(data?.data) ||
    pickArray(data?.rows) ||
    pickArray(data?.result) ||
    pickArray(data?.data?.rows) ||
    pickArray(data?.data?.data) ||
    []
  ) as MiTribunalItem[];
}

export const tribunalesDocenteService = {
  // ✅ Backend real: GET /tribunales-estudiantes/mis-asignaciones (ROL 3)
  misTribunales: async (params?: { includeInactive?: boolean }): Promise<{ ok: true; data: MiTribunalItem[] }> => {
    const res = await axiosClient.get("/tribunales-estudiantes/mis-asignaciones", {
      params: { includeInactive: params?.includeInactive ? "true" : "false" },
    });

    // devolvemos {ok:true, data:[...]} para que tu MisCalificacionesPage siga igual
    return { ok: true, data: unwrapArray(res) };
  },
};
