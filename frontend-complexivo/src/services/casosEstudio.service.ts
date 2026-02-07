// src/services/casosEstudio.service.ts
import axiosClient from "../api/axiosClient";
import type { CasoEstudio } from "../types/casoEstudio";

function pickArray(x: any): any[] | null {
  return Array.isArray(x) ? x : null;
}

function unwrapArray(res: any): CasoEstudio[] {
  const data = res?.data ?? res;
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

function unwrapObject(res: any): any {
  const data = res?.data ?? res;
  return data?.data ?? data;
}

export const casosEstudioService = {
  async list(params?: { includeInactive?: boolean }) {
    const res = await axiosClient.get("/casos-estudio", {
      params: { includeInactive: !!params?.includeInactive },
    });
    return unwrapArray(res);
  },

  async create(fd: FormData) {
    const res = await axiosClient.post("/casos-estudio", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrapObject(res);
  },

  async update(id: number, fd: FormData) {
    const res = await axiosClient.put(`/casos-estudio/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrapObject(res);
  },

  async toggleEstado(id: number, estadoActual: 0 | 1) {
    const res = await axiosClient.patch(`/casos-estudio/${id}/estado`, {
      estado: estadoActual === 1 ? 0 : 1,
    });
    return unwrapObject(res);
  },

  // ✅ DESCARGA PDF del caso base
  async download(id_caso_estudio: number) {
    return axiosClient.get(`/casos-estudio/${id_caso_estudio}/download`, {
      responseType: "blob",
    });
  },
};
