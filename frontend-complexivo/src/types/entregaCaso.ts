// ✅ src/services/entregasCaso.service.ts
import axiosClient from "../api/axiosClient";

const BASE = "/entregas-caso";

export type EntregaByEstudianteCreateDTO = {
  id_estudiante: number;
  archivo: File;
  observacion?: string;
};

export const entregasCasoService = {
  // ✅ Subir/Reemplazar por estudiante
  subirByEstudiante: async (payload: EntregaByEstudianteCreateDTO) => {
    const formData = new FormData();
    formData.append("id_estudiante", String(payload.id_estudiante));
    formData.append("archivo", payload.archivo);
    if (payload.observacion) formData.append("observacion", payload.observacion);

    return axiosClient.post(`${BASE}/by-estudiante`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ✅ Descargar PDF por estudiante
  downloadByEstudiante: async (id_estudiante: number) => {
    return axiosClient.get(`${BASE}/${id_estudiante}/download`, {
      responseType: "blob",
      transformResponse: (r) => r,
    });
  },

  // ✅ (opcional) obtener metadata JSON de entrega
  getByEstudiante: async (id_estudiante: number) => {
    const res = await axiosClient.get(`${BASE}/${id_estudiante}`);
    return res?.data?.data ?? res?.data;
  },
};
