// src/api/axiosClient.ts
import axios from "axios";
import { clearSession, getToken } from "../utils/auth";

function normalizeBaseURL() {
  const raw = (import.meta.env.VITE_API_URL || "https://complexivo-espe.onrender.com/api").trim();

  // si viene "https://.../api" lo dejamos
  if (raw.endsWith("/api")) return raw;

  // si viene "https://.../api/" lo dejamos sin el slash final
  if (raw.endsWith("/api/")) return raw.slice(0, -1);

  // si viene "https://..." lo convertimos a "https://.../api"
  return raw.replace(/\/$/, "") + "/api";
}

const axiosClient = axios.create({
  baseURL: normalizeBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor REQUEST: adjunta token si existe
axiosClient.interceptors.request.use(
  (config) => {
    const token = getToken(); // usa tu utils/auth.ts

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor RESPONSE: manejo unificado de errores + 401 cleanup
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    console.log("AXIOS ERROR STATUS:", status);
    console.log("AXIOS ERROR DATA:", data);

    // ✅ si backend manda { message }, úsalo
    const message = data?.message || error?.message || "Error inesperado en el servidor";
    console.error("AXIOS ERROR MESSAGE:", message);

    // ✅ Si token inválido/expirado
    if (status === 401) {
      clearSession();
    }

    return Promise.reject({
      ...error,
      status,
      data,
      userMessage: message,
    });
  }
);

export default axiosClient;
