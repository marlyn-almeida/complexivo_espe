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

  // ✅ Descargar PDF por ENTREGA (cuando el listado trae id_entrega)
  downloadByEntrega: async (id_entrega: number) => {
    return axiosClient.get(`${BASE}/${id_entrega}/download`, {
      responseType: "blob",
      transformResponse: (r) => r,
      headers: { Accept: "application/pdf" },
    });
  },

  // ✅ Descargar PDF por ESTUDIANTE (fallback si tu backend soporta esto)
  downloadByEstudiante: async (id_estudiante: number) => {
    return axiosClient.get(`${BASE}/${id_estudiante}/download`, {
      responseType: "blob",
      transformResponse: (r) => r,
      headers: { Accept: "application/pdf" },
    });
  },

  // ✅ (opcional) metadata JSON
  getByEstudiante: async (id_estudiante: number) => {
    const res = await axiosClient.get(`${BASE}/${id_estudiante}`);
    return res?.data?.data ?? res?.data;
  },
};
