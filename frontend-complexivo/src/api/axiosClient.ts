// src/api/axiosClient.ts
import axios from "axios";
import { clearSession, getToken } from "../utils/auth";

function normalizeBaseURL() {
  const raw = (import.meta.env.VITE_API_URL || "https://complexivo-espe.onrender.com/api").trim();
  if (raw.endsWith("/api")) return raw;
  if (raw.endsWith("/api/")) return raw.slice(0, -1);
  return raw.replace(/\/$/, "") + "/api";
}

const ACTIVE_CP_KEY = "active_carrera_periodo_id";

function getActiveCarreraPeriodoId(): number | null {
  const v = localStorage.getItem(ACTIVE_CP_KEY);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const axiosClient = axios.create({
  baseURL: normalizeBaseURL(),
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    const cpId = getActiveCarreraPeriodoId();
    if (cpId) {
      config.headers = config.headers ?? {};

      // ✅ HEADERS (compatibilidad)
      (config.headers as any)["x-id-carrera-periodo"] = String(cpId);
      (config.headers as any)["x-carrera-periodo-id"] = String(cpId);
      (config.headers as any)["x-carrera-periodo"] = String(cpId);
      (config.headers as any)["x-cp-id"] = String(cpId);

      // ❌ IMPORTANTE:
      // NO agregues CP como query param global, porque contamina endpoints como /docentes
      // y te filtra resultados sin querer.
    }

    return config;
  },
  (error) => Promise.reject(error)
);

function getErrorsArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data.errors)) return data.errors;

  if (data.errors && typeof data.errors === "object") {
    const out: any[] = [];
    for (const [k, v] of Object.entries(data.errors)) {
      if (Array.isArray(v)) out.push({ field: k, message: v.join(", ") });
      else out.push({ field: k, message: String(v) });
    }
    return out;
  }
  return [];
}

function buildUserMessage(status?: number, data?: any, fallback?: string) {
  const base = data?.message || fallback || "Error inesperado";

  const errs = getErrorsArray(data);
  const first = errs?.[0];

  if (first) {
    if (first.field && first.message) return `${base}: ${first.field} → ${first.message}`;
    if (typeof first === "string") return `${base}: ${first}`;
    if ((first as any).msg) return `${base}: ${(first as any).msg}`;
    if ((first as any).message) return `${base}: ${(first as any).message}`;
  }

  if (status === 401) return "Sesión expirada. Vuelve a iniciar sesión.";
  if (status === 403) return "No tienes permisos para realizar esta acción.";
  if (status === 404) return "Recurso no encontrado.";
  if (status === 422) return base;
  if (status && status >= 500) return "Error del servidor. Intenta nuevamente.";

  return base;
}

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
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

    if (status === 401) clearSession();

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

export function setActiveCarreraPeriodoId(id: number | null) {
  if (!id || id <= 0) localStorage.removeItem(ACTIVE_CP_KEY);
  else localStorage.setItem(ACTIVE_CP_KEY, String(id));
}
