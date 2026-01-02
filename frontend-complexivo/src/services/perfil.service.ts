import axiosClient from "../api/axiosClient";
import type { PerfilMeResponse, ChangePasswordDTO } from "../types/perfil";

export const perfilService = {
  me: async (): Promise<PerfilMeResponse> => {
    const res = await axiosClient.get<PerfilMeResponse>("/perfil/me");
    return res.data;
  },

  changePassword: async (payload: ChangePasswordDTO) => {
    const res = await axiosClient.patch("/perfil/password", payload);
    return res.data;
  },
};
