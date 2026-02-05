// src/services/entregasCaso.service.ts
import axiosClient from "../api/axiosClient";
import type { EntregaCaso, EntregaCasoCreate } from "../types/entregaCaso";

export const entregasCasoService = {
  subir: async (payload: EntregaCasoCreate): Promise<EntregaCaso> => {
    const formData = new FormData();
    formData.append("id_estudiante", String(payload.id_estudiante)); // ✅ NUEVO
    formData.append("id_caso_estudio", String(payload.id_caso_estudio));
    formData.append("archivo", payload.archivo);
    if (payload.observacion) formData.append("observacion", payload.observacion);

    const { data } = await axiosClient.post("/entregas-caso", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
