// ✅ src/services/estudiantesImport.service.ts
import * as XLSX from "xlsx";
import type { EstudianteCreateDTO } from "./estudiantes.service";

type RawRow = Record<string, any>;

function normalizeKey(v: any): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sin tildes
    .replace(/\s+/g, " ")
    .replace(/[._-]+/g, " "); // separadores -> espacios
}

function asString(v: any): string {
  return String(v ?? "").trim();
}

function onlyDigits(v: any): string {
  return String(v ?? "").replace(/\D+/g, "").trim();
}

/**
 * ✅ Headers “bonitos” (NO nombres de BD)
 * - ID Institucional
 * - Cédula
 * - Nombres
 * - Apellidos
 * - Correo
 * - Teléfono
 */
const FRIENDLY_HEADERS = ["ID Institucional", "Cédula", "Nombres", "Apellidos", "Correo", "Teléfono"];

/** Mapea posibles nombres que el usuario pueda poner en Excel */
const KEY_ALIASES: Record<string, string[]> = {
  idInst: ["id institucional", "id", "identificacion", "usuario", "id estudiante", "codigo", "matricula"],
  cedula: ["cedula", "c i", "ci", "documento", "numero de cedula", "nro cedula"],
  nombres: ["nombres", "nombre", "nombres estudiante"],
  apellidos: ["apellidos", "apellido", "apellidos estudiante"],
  correo: ["correo", "email", "e mail", "mail"],
  telefono: ["telefono", "teléfono", "celular", "movil", "móvil"],
};

function pickByAliases(row: RawRow, aliases: string[]): any {
  const keys = Object.keys(row);
  for (const k of keys) {
    const nk = normalizeKey(k);
    for (const a of aliases) {
      if (nk === normalizeKey(a)) return row[k];
    }
  }
  return "";
}

/** ✅ Plantilla CSV con headers bonitos */
export function downloadPlantillaEstudiantesCSV() {
  const csv = `${FRIENDLY_HEADERS.join(",")}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_estudiantes.csv";
  a.click();

  URL.revokeObjectURL(url);
}

/** ✅ Plantilla EXCEL con headers bonitos */
export function downloadPlantillaEstudiantesXLSX() {
  const ws = XLSX.utils.aoa_to_sheet([FRIENDLY_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");

  XLSX.writeFile(wb, "plantilla_estudiantes.xlsx");
}

/**
 * ✅ Parser Excel/CSV
 * - NO trae nombre_carrera/codigo_periodo
 * - id_carrera_periodo se asigna desde el modal (selected CP)
 */
export async function parseExcelEstudiantes(
  file: File
): Promise<
  Array<
    EstudianteCreateDTO & {
      __rowNumber: number;
      cedula: string; // forzado
    }
  >
> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("El archivo no tiene hojas.");

  const ws = wb.Sheets[sheetName];
  const json: RawRow[] = XLSX.utils.sheet_to_json(ws, {
    defval: "",
    raw: false,
  });

  if (!json.length) throw new Error("El archivo no tiene filas.");

  const out: any[] = [];

  for (let i = 0; i < json.length; i++) {
    const row = json[i];
    const rowNumber = i + 2; // fila 1 = header

    const idInst = asString(pickByAliases(row, KEY_ALIASES.idInst));
    const cedula = onlyDigits(pickByAliases(row, KEY_ALIASES.cedula));
    const nombres = asString(pickByAliases(row, KEY_ALIASES.nombres));
    const apellidos = asString(pickByAliases(row, KEY_ALIASES.apellidos));
    const correo = asString(pickByAliases(row, KEY_ALIASES.correo));
    const telefono = asString(pickByAliases(row, KEY_ALIASES.telefono));

    // ✅ Validaciones mínimas (según tu BD)
    if (!idInst) throw new Error(`Fila ${rowNumber}: falta "ID Institucional".`);

    if (!cedula) throw new Error(`Fila ${rowNumber}: falta "Cédula".`);
    if (!/^\d+$/.test(cedula)) throw new Error(`Fila ${rowNumber}: "Cédula" solo debe contener números.`);
    if (cedula.length < 10) throw new Error(`Fila ${rowNumber}: "Cédula" inválida (mínimo 10 dígitos).`);

    if (!nombres || nombres.length < 3) throw new Error(`Fila ${rowNumber}: "Nombres" inválido (mínimo 3).`);
    if (!apellidos || apellidos.length < 3) throw new Error(`Fila ${rowNumber}: "Apellidos" inválido (mínimo 3).`);

    if (correo && !/^\S+@\S+\.\S+$/.test(correo)) throw new Error(`Fila ${rowNumber}: "Correo" no válido.`);

    out.push({
      __rowNumber: rowNumber,

      // ✅ se setea desde el modal, aquí va dummy
      id_carrera_periodo: 0,

      id_institucional_estudiante: idInst,
      cedula,

      nombres_estudiante: nombres,
      apellidos_estudiante: apellidos,

      correo_estudiante: correo || undefined,
      telefono_estudiante: telefono || undefined,
    });
  }

  return out;
}
