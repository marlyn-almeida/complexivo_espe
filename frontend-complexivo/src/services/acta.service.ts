// ✅ src/services/acta.service.ts
import axiosClient from "../api/axiosClient";
import type { Acta, ActaGenerarRequest, ActaGenerarResponse } from "../types/acta";

/**
 * ✅ Helpers
 */
function unwrap<T = any>(res: any): T {
  const data = res?.data ?? res;
  return (data?.data ?? data) as T;
}

function pickArray(x: any): any[] | null {
  return Array.isArray(x) ? x : null;
}

// Para endpoints que devuelven {data:[...]}, {rows:[...]}, {result:[...]}, etc.
function unwrapArray(res: any): any[] {
  const data = res?.data ?? res;
  return (
    pickArray(data) ||
    pickArray(data?.data) ||
    pickArray(data?.rows) ||
    pickArray(data?.result) ||
    pickArray(data?.data?.rows) ||
    pickArray(data?.data?.data) ||
    []
  );
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

/**
 * ✅ Tipos de listado (flexibles)
 * Ajusta/usa los campos que tu backend ya devuelve.
 */
export type ActaListRow = {
  id_tribunal_estudiante: number;

  // opcionales (según tu backend)
  estudiante?: string | null;
  tribunal?: string | null;
  fecha?: string | null;
  cerrado?: 0 | 1 | boolean;

  id_acta?: number | null;
  tiene_firmada?: boolean | 0 | 1;

  // si tu backend manda url o nombre
  pdf_firmado?: string | null;
};

export const actasService = {
  /**
   * ✅ Genera acta (devuelve acta + archivos)
   */
  generar: async (payload: ActaGenerarRequest): Promise<ActaGenerarResponse> => {
    const res = await axiosClient.post("/actas/generar", payload);
    return unwrap<ActaGenerarResponse>(res);
  },

  /**
   * ✅ Get por id_acta
   */
  get: async (id_acta: number): Promise<Acta> => {
    const res = await axiosClient.get(`/actas/${id_acta}`);
    return unwrap<Acta>(res);
  },

  /**
   * ✅ Descargar DOCX
   */
  downloadDocx: async (id_acta: number) => {
    const res = await axiosClient.get(`/actas/${id_acta}/docx`, { responseType: "blob" });
    if (!isDocxRes(res)) throw new Error("El backend no devolvió un DOCX.");
    downloadAxiosBlob(res, `acta_${id_acta}.docx`);
  },

  /**
   * ✅ Descargar PDF
   */
  downloadPdf: async (id_acta: number) => {
    const res = await axiosClient.get(`/actas/${id_acta}/pdf`, { responseType: "blob" });
    if (!isPdfRes(res)) throw new Error("El backend no devolvió un PDF.");
    downloadAxiosBlob(res, `acta_${id_acta}.pdf`);
  },

  /**
   * ✅ Subir PDF firmado (PRESIDENTE)
   */
  subirFirmada: async (id_acta: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await axiosClient.post(`/actas/${id_acta}/subir-firmada`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(res);
  },

  /* =========================================================
     ✅ NUEVO: LISTADOS
     - Docente: /actas (tribunales cerrados para actas)
     - Admin/Director: /actas-firmadas (ver firmadas)
     ========================================================= */

  /**
   * ✅ DOCENTE (rol 3): listado de tribunales cerrados / actas disponibles
   * Cambia SOLO la ruta si tu backend usa otra.
   */
  listDocente: async (): Promise<ActaListRow[]> => {
    // 👇 AJUSTA AQUÍ si tu endpoint real es distinto
    const res = await axiosClient.get("/actas/mis");
    return unwrapArray(res) as ActaListRow[];
  },

  /**
   * ✅ ADMIN/DIRECTOR (rol 2): listado de actas firmadas
   * Cambia SOLO la ruta si tu backend usa otra.
   */
  listFirmadas: async (): Promise<ActaListRow[]> => {
    // 👇 AJUSTA AQUÍ si tu endpoint real es distinto
    const res = await axiosClient.get("/actas/firmadas");
    return unwrapArray(res) as ActaListRow[];
  },
};