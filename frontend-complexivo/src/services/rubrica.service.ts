import axiosClient from "../api/axiosClient";
import type { Rubrica } from "../types/rubrica";

type EnsurePayload = {
  nombre_rubrica?: string;
  descripcion_rubrica?: string | null; // ✅ permitimos null aquí, pero lo saneamos
  ponderacion_global?: number;
};

export const rubricaService = {
  // ✅ Si no existe rúbrica para ese período, devolvemos null (404 esperado)
  getByPeriodo: async (periodoId: number) => {
    try {
      const res = await axiosClient.get(`/rubricas/periodo/${periodoId}`);
      return res.data as Rubrica;
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      // 404 normal cuando aún no se ha creado la rúbrica
      if (
        status === 404 &&
        String(msg || "").toLowerCase().includes("no existe rúbrica")
      ) {
        return null;
      }

      // otros errores sí deben explotar
      throw err;
    }
  },

  ensureByPeriodo: async (periodoId: number, payload?: EnsurePayload) => {
    // ✅ SANITIZAR: evitar 422 por descripcion_rubrica inválida
    // - Si viene null/undefined -> "" (string)
    // - Si viene string -> trim()
    // - Si queda vacío -> "" (string)
    const safePayload: EnsurePayload = payload
      ? {
          ...payload,
          descripcion_rubrica:
            typeof payload.descripcion_rubrica === "string"
              ? payload.descripcion_rubrica.trim()
              : "",
        }
      : {};

    const res = await axiosClient.post(
      `/rubricas/periodo/${periodoId}`,
      safePayload
    );
    return res.data as { created: boolean; rubrica: Rubrica };
  },

  update: async (
    id: number,
    payload: {
      nombre_rubrica?: string;
      descripcion_rubrica?: string | null; // ✅ idem, blindado
      ponderacion_global?: number;
    }
  ) => {
    // ✅ También blindamos update por si el backend valida igual
    const safePayload = {
      ...payload,
      descripcion_rubrica:
        typeof payload.descripcion_rubrica === "string"
          ? payload.descripcion_rubrica.trim()
          : "",
    };

    const res = await axiosClient.put(`/rubricas/${id}`, safePayload);
    return res.data as Rubrica;
  },

  changeEstado: async (id: number, estado: boolean) => {
    const res = await axiosClient.patch(`/rubricas/${id}/estado`, { estado });
    return res.data;
  },
};
