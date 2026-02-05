// src/services/casosEstudio.service.ts
import axiosClient from "../api/axiosClient";
import type { CasoEstudio } from "../types/casoEstudio";

function pickArray(x: any): any[] | null {
  if (Array.isArray(x)) return x;
  return null;
}

function unwrapArrayFromAxios(res: any): CasoEstudio[] {
  // axiosClient devuelve AxiosResponse (response)
  const data = res?.data ?? res;

  // posibles formas:
  // 1) data = []
  // 2) data = { ok:true, data: [] }
  // 3) data = { data: [] }
  // 4) data = { ok:true, rows: [] }
  // 5) data = { ok:true, data: { rows: [] } }
  // 6) data = { result: [] }

  return (
    pickArray(data) ||
    pickArray(data?.data) ||
    pickArray(data?.rows) ||
    pickArray(data?.result) ||
    pickArray(data?.data?.rows) ||
    pickArray(data?.data?.data) ||
    []
  ) as CasoEstudio[];
}

function unwrapObjectFromAxios(res: any): any {
  const data = res?.data ?? res;
  // a veces viene { ok:true, data:{...} }
  return data?.data ?? data;
}

export const casosEstudioService = {
  async list(params: { includeInactive?: boolean; carreraPeriodoId: number }) {
    const res = await axiosClient.get("/casos-estudio", {
      params: {
        includeInactive: !!params.includeInactive,
        carreraPeriodoId: params.carreraPeriodoId,
      },
    });
    return unwrapArrayFromAxios(res);
  },

  async create(fd: FormData) {
    const res = await axiosClient.post("/casos-estudio", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrapObjectFromAxios(res);
  },

  async update(id: number, fd: FormData) {
    const res = await axiosClient.put(`/casos-estudio/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrapObjectFromAxios(res);
  },

  async toggleEstado(id: number, estadoActual: 0 | 1) {
    const res = await axiosClient.patch(`/casos-estudio/${id}/estado`, {
      estado: estadoActual === 1 ? 0 : 1,
    });
    return unwrapObjectFromAxios(res);
  },

  async download(id: number) {
    // backend debería devolver archivo
    return axiosClient.get(`/casos-estudio/${id}/download`, { responseType: "blob" });
  },
};
