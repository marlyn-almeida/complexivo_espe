// ✅ src/services/misCalificaciones.service.ts
import axiosClient from "../api/axiosClient";
import type { MisCalificacionRow } from "../types/misCalificacion";

function pickArray(x: any): any[] | null {
  return Array.isArray(x) ? x : null;
}

function unwrapArray(res: any): MisCalificacionRow[] {
  const data = res?.data ?? res;
  return (
    pickArray(data) ||
    pickArray(data?.data) ||
    pickArray(data?.rows) ||
    pickArray(data?.result) ||
    pickArray(data?.data?.rows) ||
    pickArray(data?.data?.data) ||
    []
  ) as MisCalificacionRow[];
}

export const misCalificacionesService = {
  async list(): Promise<MisCalificacionRow[]> {
    const res = await axiosClient.get("/mis-calificaciones");
    return unwrapArray(res);
  },
};
