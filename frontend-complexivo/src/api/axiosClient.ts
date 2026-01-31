// src/api/axiosClient.ts
import axios from "axios";
import { clearSession, getToken } from "../utils/auth";

function normalizeBaseURL() {
  const raw = (import.meta.env.VITE_API_URL || "https://complexivo-espe.onrender.com/api").trim();

  if (raw.endsWith("/api")) return raw;
  if (raw.endsWith("/api/")) return raw.slice(0, -1);
  return raw.replace(/\/$/, "") + "/api";
}

const axiosClient = axios.create({
  baseURL: normalizeBaseURL(),
  headers: { "Content-Type": "application/json" },
});

// ✅ REQUEST: adjunta token
axiosClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helpers para parsear errores de validación
function getErrorsArray(data: any): any[] {
  if (!data) return [];
  // Caso 1: errors ya es array
  if (Array.isArray(data.errors)) return data.errors;

  // Caso 2: errors viene como objeto { campo: ["msg"] } o { campo: "msg" }
  if (data.errors && typeof data.errors === "object") {
    const out: any[] = [];
    for (const [k, v] of Object.entries(data.errors)) {
      if (Array.isArray(v)) out.push({ field: k, message: v.join(", ") });
      else out.push({ field: k, message: String(v) });
    }
    return out;
  }

  // Caso 3: backend manda { error: ... } u otra forma
  return [];
}

function buildUserMessage(status?: number, data?: any, fallback?: string) {
  const base = data?.message || fallback || "Error inesperado";

  // Si hay errores, agregamos el primero para que sea útil
  const errs = getErrorsArray(data);
  const first = errs?.[0];

  if (first) {
    // si el backend manda { field, message }
    if (first.field && first.message) return `${base}: ${first.field} → ${first.message}`;
    // si manda string
    if (typeof first === "string") return `${base}: ${first}`;
    // si manda { msg } o { message }
    if (first.msg) return `${base}: ${first.msg}`;
    if (first.message) return `${base}: ${first.message}`;
  }

  // Errores típicos por status
  if (status === 401) return "Sesión expirada. Vuelve a iniciar sesión.";
  if (status === 403) return "No tienes permisos para realizar esta acción.";
  if (status === 404) return "Recurso no encontrado.";
  if (status === 422) return base; // ya es validación, pero sin detalle
  if (status && status >= 500) return "Error del servidor. Intenta nuevamente.";

  return base;
}

// ✅ RESPONSE: manejo unificado + logs completos
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si no hay response => error de red / CORS / server caído
    if (!error?.response) {
      console.log("AXIOS NETWORK ERROR:", error?.message);
      return Promise.reject({
        ...error,
        status: 0,
        data: null,
        userMessage: "No se pudo conectar con el servidor. Revisa tu internet o intenta más tarde.",
      });
    }

    const status = error.response.status;
    const data = error.response.data;

    const errorsArr = getErrorsArray(data);
    const firstError = errorsArr?.[0] ?? null;

    console.log("AXIOS ERROR STATUS:", status);
    console.log("AXIOS ERROR DATA:", data);
    console.log("AXIOS ERROR ERRORS:", errorsArr);
    console.log("AXIOS ERROR FIRST:", firstError);

    const userMessage = buildUserMessage(status, data, error?.message);

    // ✅ Si token inválido/expirado
    if (status === 401) {
      clearSession();
    }

    return Promise.reject({
      ...error,
      status,
      data,
      errors: errorsArr,
      firstError,
      userMessage,
    });
  }
);

export default axiosClient;
