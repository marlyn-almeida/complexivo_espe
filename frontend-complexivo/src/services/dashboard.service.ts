import axiosClient from "../api/axiosClient";

export type DashboardResumen = {
  periodos_activos?: number;
  periodos_cerrados?: number;
  estudiantes_habilitados?: number;
  estudiantes_pendientes?: number;
  rubricas_configuradas?: number;
  tribunales_total?: number;
  docentes_total?: number;
  actas_generadas?: number;
  aprobados?: number;
  pendientes_calificacion?: number;
  tribunales_activos?: number;
  proximas_sesiones?: string[];
};

export const dashboardService = {
  resumen: async (): Promise<DashboardResumen> => {
    const res = await axiosClient.get<DashboardResumen>("/dashboard/resumen");
    return res.data;
  },
};
