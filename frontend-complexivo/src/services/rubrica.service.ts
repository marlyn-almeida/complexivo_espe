import axiosClient from "../api/axiosClient";
import type { Rubrica } from "../types/rubrica";

type EnsurePayload = {
  nombre_rubrica?: string;
  descripcion_rubrica?: string | null;
  ponderacion_global?: number;
};

type ApiOk<T> = { ok: true; data: T };

export const rubricaService = {
  // ✅ Si no existe rúbrica para ese período, devolvemos null (404 esperado)
  getByPeriodo: async (periodoId: number): Promise<Rubrica | null> => {
    try {
      const res = await axiosClient.get<ApiOk<Rubrica>>(`/rubricas/periodo/${periodoId}`);
      return res.data.data; // ✅ AQUI estaba el error
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      // ✅ 404 normal cuando aún no se ha creado la rúbrica
      if (status === 404) return null;

      throw err;
    }
  },

  ensureByPeriodo: async (periodoId: number, payload?: EnsurePayload): Promise<Rubrica> => {
    // ✅ Sanitizar descripción para evitar validaciones
    const safePayload: EnsurePayload = payload
      ? {
          ...payload,
          descripcion_rubrica:
            typeof payload.descripcion_rubrica === "string"
              ? payload.descripcion_rubrica.trim()
              : "",
        }
      : {};

    const res = await axiosClient.post<ApiOk<Rubrica>>(`/rubricas/periodo/${periodoId}`, safePayload);
    return res.data.data; // ✅ aquí igual
  },

  update: async (
    id: number,
    payload: {
      nombre_rubrica?: string;
      descripcion_rubrica?: string | null;
      ponderacion_global?: number;
    }
  ): Promise<void> => {
    const safePayload = {
      ...payload,
      descripcion_rubrica:
        typeof payload.descripcion_rubrica === "string"
          ? payload.descripcion_rubrica.trim()
          : "",
    };

    await axiosClient.put(`/rubricas/${id}`, safePayload);
  },

  changeEstado: async (id: number, estado: boolean): Promise<void> => {
    await axiosClient.patch(`/rubricas/${id}/estado`, { estado });
  },
};
