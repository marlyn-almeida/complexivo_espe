import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://complexivo-espe.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor REQUEST: adjunta token si existe
axiosClient.interceptors.request.use(
  (config) => {
    // 🔥 Ajusta la key si tú guardas con otro nombre
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor RESPONSE: tu debug tal cual
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    console.log("AXIOS ERROR STATUS:", status);
    console.log("AXIOS ERROR DATA:", data);

    const message = data?.message || error?.message || "Error inesperado en el servidor";
    console.error("AXIOS ERROR MESSAGE:", message);

    return Promise.reject({
      ...error,
      status,
      data,
      userMessage: message,
    });
  }
);

export default axiosClient;
