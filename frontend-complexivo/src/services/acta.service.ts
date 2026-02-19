// src/services/actas.service.ts
import axiosClient from "../api/axiosClient";
import type { Acta, ActaGenerarRequest, ActaGenerarResponse } from "../types/acta";

function unwrap<T = any>(res: any): T {
  const data = res?.data ?? res;
  return (data?.data ?? data) as T;
}

function safeFileName(name: string) {
  return String(name || "archivo")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
}

function isPdfRes(res: any) {
  const ct = String(res?.headers?.["content-type"] ?? "");
  return ct.includes("pdf");
}
function isDocxRes(res: any) {
  const ct = String(res?.headers?.["content-type"] ?? "");
  return ct.includes("officedocument") || ct.includes("wordprocessingml");
}

function downloadAxiosBlob(res: any, filename: string) {
  const blob = new Blob([res.data], { type: res?.headers?.["content-type"] || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFileName(filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const actasService = {
  // ✅ genera acta (devuelve acta + archivos)
  generar: async (payload: ActaGenerarRequest): Promise<ActaGenerarResponse> => {
    const res = await axiosClient.post("/actas/generar", payload);
    return unwrap<ActaGenerarResponse>(res);
  },

  // ✅ get por id_acta
  get: async (id_acta: number): Promise<Acta> => {
    const res = await axiosClient.get(`/actas/${id_acta}`);
    return unwrap<Acta>(res);
  },

  // ✅ descargar DOCX (si tu backend lo expone como endpoint)
  // Si en tu backend descargas por url directa, igual puedes usar window.open(url)
  downloadDocx: async (id_acta: number) => {
    const res = await axiosClient.get(`/actas/${id_acta}/docx`, { responseType: "blob" });
    if (!isDocxRes(res)) throw new Error("El backend no devolvió un DOCX.");
    downloadAxiosBlob(res, `acta_${id_acta}.docx`);
  },

  // ✅ descargar PDF (si tu backend lo expone como endpoint)
  downloadPdf: async (id_acta: number) => {
    const res = await axiosClient.get(`/actas/${id_acta}/pdf`, { responseType: "blob" });
    if (!isPdfRes(res)) throw new Error("El backend no devolvió un PDF.");
    downloadAxiosBlob(res, `acta_${id_acta}.pdf`);
  },

  // ✅ subir PDF firmado (PRESIDENTE)
  subirFirmada: async (id_acta: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await axiosClient.post(`/actas/${id_acta}/subir-firmada`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(res);
  },
};
