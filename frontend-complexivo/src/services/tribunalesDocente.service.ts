// ✅ src/services/tribunalesDocente.service.ts
import axiosClient from "../api/axiosClient";

export type MiTribunalItem = {
  id_tribunal_estudiante: number;
  id_tribunal: number;
  id_estudiante: number;

  estudiante: string; // "Nombres Apellidos"
  carrera?: string | null;
  fecha?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;

  cerrado?: 0 | 1;
};

function pickArray(x: any): any[] | null {
  return Array.isArray(x) ? x : null;
}

function unwrapArray<T = any>(res: any): T[] {
  const data = res?.data ?? res;
  return (
    pickArray(data) ||
    pickArray(data?.data) ||
    pickArray(data?.rows) ||
    pickArray(data?.result) ||
    pickArray(data?.data?.rows) ||
    pickArray(data?.data?.data) ||
    []
  ) as T[];
}

export const tribunalesDocenteService = {
  // ✅ agenda del docente (ROL 3)
  misTribunales: async (includeInactive = false): Promise<{ ok: true; data: MiTribunalItem[] }> => {
    const res = await axiosClient.get("/tribunales-estudiantes/mis-asignaciones", {
      params: { includeInactive: includeInactive ? "true" : "false" },
    });

    // tu backend devuelve array directo o {ok,data}
    const data = res?.data;
    if (data?.ok && Array.isArray(data?.data)) return data;

    return { ok: true, data: unwrapArray<MiTribunalItem>(res) };
  },
};
