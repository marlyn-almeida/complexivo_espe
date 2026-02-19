// src/services/docentes.service.ts
import axiosClient from "../api/axiosClient";
import type { Docente, Estado01 } from "../types/docente";

export type DocenteListParams = {
  includeInactive?: boolean;
  q?: string;
  page?: number;
  limit?: number;
  id_carrera?: number | null;

  // ✅ filtro por departamento
  id_departamento?: number | null;
};

export type DocenteCreateDTO = {
  id_institucional_docente: string;
  id_departamento: number; // ✅ OBLIGATORIO
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;

  correo_docente: string; // ✅ obligatorio en tu BD + triggers
  telefono_docente?: string | null;

  nombre_usuario: string;

  // ✅ si quieres asignar carrera al crear (opcional)
  id_carrera?: number;
  codigo_carrera?: string;
};

export type DocenteUpdateDTO = {
  id_institucional_docente: string;
  id_departamento: number; // ✅ OBLIGATORIO
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;

  correo_docente: string; // ✅ obligatorio
  telefono_docente?: string | null;

  nombre_usuario: string;
};

// =========================
// ✅ TIPOS IMPORT MASIVO
// =========================
export type DocenteImportRow = {
  id_institucional_docente: string;
  cedula: string;
  apellidos_docente: string;
  nombres_docente: string;
  correo_docente: string;
  telefono_docente?: string;
  nombre_usuario: string;
};

export type DocenteImportBulkResponse = {
  ok: boolean;
  resumen: {
    total: number;
    importados: number;
    omitidos: number;
  };
  detalles: {
    importados: Array<{
      fila: number;
      id_institucional_docente: string;
      cedula: string;
      nombre_usuario: string;
    }>;
    omitidos: Array<{
      fila: number;
      motivo: string;
      id_institucional_docente?: string;
      cedula?: string;
      nombre_usuario?: string;
    }>;
  };
};

export const docentesService = {
  list: async (arg: boolean | DocenteListParams = false): Promise<Docente[]> => {
    const paramsObj: DocenteListParams =
      typeof arg === "boolean" ? { includeInactive: arg } : (arg ?? {});

    const limit = Math.min(Math.max(paramsObj.limit ?? 100, 1), 100);

    const idCarrera =
      paramsObj.id_carrera != null && Number(paramsObj.id_carrera) > 0
        ? Number(paramsObj.id_carrera)
        : undefined;

    const idDepartamento =
      paramsObj.id_departamento != null && Number(paramsObj.id_departamento) > 0
        ? Number(paramsObj.id_departamento)
        : undefined;

    const res = await axiosClient.get<Docente[]>("/docentes", {
      params: {
        includeInactive: paramsObj.includeInactive ? 1 : 0,
        q: paramsObj.q?.trim() || undefined,
        page: paramsObj.page ?? 1,
        limit,
        id_carrera: idCarrera,
        id_departamento: idDepartamento,
      },
    });

    return res.data ?? [];
  },

  get: async (id: number): Promise<Docente> => {
    const res = await axiosClient.get<Docente>(`/docentes/${id}`);
    return res.data;
  },

  create: async (payload: DocenteCreateDTO) => {
    const res = await axiosClient.post("/docentes", payload);
    return res.data;
  },

  update: async (id: number, payload: DocenteUpdateDTO) => {
    const res = await axiosClient.put(`/docentes/${id}`, payload);
    return res.data;
  },

  toggleEstado: async (id: number, currentEstado: Estado01) => {
    const nuevo: Estado01 = currentEstado === 1 ? 0 : 1;
    const res = await axiosClient.patch(`/docentes/${id}/estado`, { estado: nuevo });
    return res.data;
  },

  setSuperAdmin: async (id: number, enabled: boolean) => {
    const res = await axiosClient.patch(`/docentes/${id}/super-admin`, { enabled });
    return res.data;
  },

  // ✅ IMPORT MASIVO (usa tu backend: POST /api/docentes/import)
  importBulk: async (payload: { id_departamento: number; rows: DocenteImportRow[] }) => {
    const res = await axiosClient.post<DocenteImportBulkResponse>("/docentes/import", payload);
    return res.data;
  },
};

export type DocenteImportBulkPayload = {
  id_departamento: number;
  rows: any[];
};

