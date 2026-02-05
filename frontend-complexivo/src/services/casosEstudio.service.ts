import axiosClient from "../api/axiosClient";
import type { CasoEstudio, CasoEstudioCreate } from "../types/casoEstudio";

export const casosEstudioService = {
  list: async (): Promise<CasoEstudio[]> => {
    const { data } = await axiosClient.get("/casos-estudio");
    return data;
  },

  create: async (payload: CasoEstudioCreate): Promise<CasoEstudio> => {
    const formData = new FormData();
    formData.append("numero_caso", String(payload.numero_caso));
    if (payload.titulo) formData.append("titulo", payload.titulo);
    if (payload.descripcion) formData.append("descripcion", payload.descripcion);
    formData.append("archivo", payload.archivo);

    const { data } = await axiosClient.post("/casos-estudio", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
