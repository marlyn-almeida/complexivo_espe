// src/services/docentesImport.service.ts
import * as XLSX from "xlsx";
import type { Carrera } from "../types/carrera";

export type DocenteImportRow = {
  id_institucional_docente: string;
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;
  correo_docente?: string;
  telefono_docente?: string;
  nombre_usuario: string;

  // nombre visible de carrera (columna del excel)
  nombre_carrera: string;
};

export function downloadPlantillaDocentesCSV() {
  const headers = [
    "id_institucional_docente",
    "cedula",
    "nombres_docente",
    "apellidos_docente",
    "correo_docente",
    "telefono_docente",
    "nombre_usuario",
    "nombre_carrera",
  ];

  const example = [
    "ESPE-12345",
    "1712345678",
    "Juan",
    "Pérez",
    "juan.perez@espe.edu.ec",
    "0999999999",
    "jperez",
    "Tecnologías de la Información",
  ];

  const csv =
    headers.join(",") +
    "\n" +
    example.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") +
    "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_docentes.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function norm(s: any) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function pick(r: any, keys: string[]) {
  for (const k of keys) {
    if (r[k] !== undefined) return r[k];
  }
  return "";
}

export async function parseExcelDocentes(file: File): Promise<{ rows: DocenteImportRow[]; errors: string[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

  if (!raw.length) return { rows: [], errors: ["El Excel está vacío."] };

  const rows: DocenteImportRow[] = [];
  const errors: string[] = [];

  raw.forEach((r, idx) => {
    const rowNum = idx + 2;

    const id_institucional_docente = String(
      pick(r, ["id_institucional_docente", "id institucional", "id_institucional", "id"])
    ).trim();

    const cedula = String(pick(r, ["cedula", "cédula"])).trim();
    const nombres_docente = String(pick(r, ["nombres_docente", "nombres"])).trim();
    const apellidos_docente = String(pick(r, ["apellidos_docente", "apellidos"])).trim();

    const correo_docente = String(pick(r, ["correo_docente", "correo"])).trim();
    const telefono_docente = String(pick(r, ["telefono_docente", "telefono", "teléfono"])).trim();

    const nombre_usuario = String(pick(r, ["nombre_usuario", "usuario", "username"])).trim();

    const nombre_carrera = String(pick(r, ["nombre_carrera", "carrera", "nombre carrera"])).trim();

    if (!id_institucional_docente || !cedula || !nombres_docente || !apellidos_docente || !nombre_usuario || !nombre_carrera) {
      errors.push(`Fila ${rowNum}: faltan campos obligatorios (incluye nombre_carrera/carrera).`);
      return;
    }

    if (correo_docente && !/^\S+@\S+\.\S+$/.test(correo_docente)) {
      errors.push(`Fila ${rowNum}: correo no válido.`);
      return;
    }

    rows.push({
      id_institucional_docente,
      cedula,
      nombres_docente,
      apellidos_docente,
      correo_docente: correo_docente || undefined,
      telefono_docente: telefono_docente || undefined,
      nombre_usuario,
      nombre_carrera,
    });
  });

  return { rows, errors };
}

export function resolveCarreraIdByNombre(nombre_carrera: string, carreras: Carrera[]): number | null {
  const map = new Map<string, number>();
  carreras
    .filter((c) => c.estado === 1)
    .forEach((c) => map.set(norm(c.nombre_carrera), c.id_carrera));

  return map.get(norm(nombre_carrera)) ?? null;
}
