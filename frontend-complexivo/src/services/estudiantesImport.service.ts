// src/services/estudiantesImport.service.ts
import * as XLSX from "xlsx";
import type { CarreraPeriodo } from "../types/carreraPeriodo";
import type { EstudianteCreateDTO } from "./estudiantes.service";

type RawRow = Record<string, any>;

function normalizeText(v: any): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function asString(v: any): string {
  return String(v ?? "").trim();
}

export function downloadPlantillaEstudiantesCSV() {
  const headers = [
    "nombre_carrera",
    "codigo_periodo",
    "id_institucional_estudiante",
    "nombres_estudiante",
    "apellidos_estudiante",
    "correo_estudiante",
    "telefono_estudiante",
  ];

  const csv = `${headers.join(",")}\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_estudiantes.csv";
  a.click();

  URL.revokeObjectURL(url);
}

export function resolveCarreraPeriodoIdByNombreCarreraCodigoPeriodo(
  nombreCarrera: string,
  codigoPeriodo: string,
  cps: CarreraPeriodo[]
): number | null {
  const nc = normalizeText(nombreCarrera);
  const cp = normalizeText(codigoPeriodo);

  if (!nc || !cp) return null;

  const found = cps.find((x) => {
    const xCarrera = normalizeText((x as any).nombre_carrera ?? "");
    const xPeriodo = normalizeText((x as any).codigo_periodo ?? "");
    return xCarrera === nc && xPeriodo === cp;
  });

  return found ? Number((found as any).id_carrera_periodo) : null;
}

export async function parseExcelEstudiantes(
  file: File
): Promise<
  Array<
    EstudianteCreateDTO & {
      __rowNumber: number;
      __nombre_carrera: string;
      __codigo_periodo: string;
    }
  >
> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("El Excel no tiene hojas.");

  const ws = wb.Sheets[sheetName];
  const json: RawRow[] = XLSX.utils.sheet_to_json(ws, {
    defval: "",
    raw: false,
  });

  if (!json.length) throw new Error("El Excel no tiene filas.");

  // Mapeo flexible de headers (por si vienen con mayúsculas/espacios)
  const pick = (row: RawRow, key: string) => {
    const nk = normalizeText(key);
    const keys = Object.keys(row);
    const foundKey = keys.find((k) => normalizeText(k) === nk);
    return foundKey ? row[foundKey] : "";
  };

  const out: any[] = [];

  for (let i = 0; i < json.length; i++) {
    const row = json[i];
    const rowNumber = i + 2; // porque la fila 1 es header

    const nombre_carrera = asString(pick(row, "nombre_carrera"));
    const codigo_periodo = asString(pick(row, "codigo_periodo"));

    const id_institucional_estudiante = asString(pick(row, "id_institucional_estudiante"));
    const nombres_estudiante = asString(pick(row, "nombres_estudiante"));
    const apellidos_estudiante = asString(pick(row, "apellidos_estudiante"));

    const correo_estudiante = asString(pick(row, "correo_estudiante"));
    const telefono_estudiante = asString(pick(row, "telefono_estudiante"));

    // Validaciones mínimas
    if (!nombre_carrera || !codigo_periodo) {
      throw new Error(`Fila ${rowNumber}: faltan nombre_carrera o codigo_periodo.`);
    }
    if (!id_institucional_estudiante) {
      throw new Error(`Fila ${rowNumber}: id_institucional_estudiante es obligatorio.`);
    }
    if (!nombres_estudiante || nombres_estudiante.length < 3) {
      throw new Error(`Fila ${rowNumber}: nombres_estudiante inválido (mínimo 3).`);
    }
    if (!apellidos_estudiante || apellidos_estudiante.length < 3) {
      throw new Error(`Fila ${rowNumber}: apellidos_estudiante inválido (mínimo 3).`);
    }
    if (correo_estudiante && !/^\S+@\S+\.\S+$/.test(correo_estudiante)) {
      throw new Error(`Fila ${rowNumber}: correo_estudiante no válido.`);
    }

    out.push({
      __rowNumber: rowNumber,
      __nombre_carrera: nombre_carrera,
      __codigo_periodo: codigo_periodo,
      // id_carrera_periodo se resuelve afuera (con cps)
      id_carrera_periodo: 0,
      id_institucional_estudiante,
      nombres_estudiante,
      apellidos_estudiante,
      correo_estudiante: correo_estudiante || undefined,
      telefono_estudiante: telefono_estudiante || undefined,
    });
  }

  return out;
}
