import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://complexivo-espe.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor para ver el detalle real del backend (422, 401, 500, etc.)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    // ✅ Esto te muestra EXACTO lo que responde el backend
    console.log("AXIOS ERROR STATUS:", status);
    console.log("AXIOS ERROR DATA:", data);

    const message =
      data?.message ||
      error?.message ||
      "Error inesperado en el servidor";

    // ✅ No solo imprimas el texto, imprime todo
    console.error("AXIOS ERROR MESSAGE:", message);

    // ✅ Rechazamos con un objeto más fácil de manejar en los pages
    return Promise.reject({
      ...error,
      status,
      data,
      userMessage: message,
    });
  }
);

export default axiosClient;
