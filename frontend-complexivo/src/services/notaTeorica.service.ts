// ✅ src/services/notaTeorica.service.ts
import axiosClient from "../api/axiosClient";

export type NotaTeoricaSaveDTO = {
  id_estudiante: number;
  nota_teorico_20: number;
  observacion?: string;
};

async function postWithFallback(urls: string[], payload: any) {
  let lastErr: any = null;

  for (const url of urls) {
    try {
      return await axiosClient.post(url, payload);
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;
      // si NO es 404, no tiene sentido intentar otro endpoint
      if (status && status !== 404) throw err;
    }
  }

  throw lastErr || new Error("No se pudo guardar nota teórica.");
}

export const notaTeoricaService = {
  async save(payload: NotaTeoricaSaveDTO) {
    // ✅ Ajusta/define aquí tu endpoint real si ya lo tienes
    const urls = ["/notas-teoricas/by-estudiante", "/nota-teorica/by-estudiante"];
    const res = await postWithFallback(urls, payload);
    return res?.data?.data ?? res?.data;
  },
};
