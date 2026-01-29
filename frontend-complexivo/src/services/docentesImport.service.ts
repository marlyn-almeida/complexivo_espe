// src/services/docentesImport.service.ts
import * as XLSX from "xlsx";

export type DocenteImportRow = {
  id_institucional_docente: string;
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;
  correo_docente: string;
  telefono_docente?: string;
  nombre_usuario: string;
};

// ✅ Para reporte/estadísticas del import
export type DocenteImportIssue = {
  rowNum: number;          // fila real en Excel (desde 2)
  docenteLabel: string;    // "PÉREZ JUAN (L00)" o lo que haya
  reason: string;          // mensaje humano
};

export type DocenteImportReport = {
  rows: DocenteImportRow[];     // solo válidos y no duplicados en el Excel
  issues: DocenteImportIssue[]; // inválidos + duplicados del Excel
  stats: {
    totalRows: number;
    valid: number;
    invalid: number;
    duplicatesInFile: number;
  };
};

export function downloadPlantillaDocentesCSV() {
  // Encabezados "para humanos", NO nombres de BD
  const headers = ["ID_ESPE", "CÉDULA", "APELLIDOS", "NOMBRES", "CORREO", "TELÉFONO", "USUARIO"];

  const example = [
    "L00",
    "171111111",
    "PÉREZ",
    "JUAN",
    "juan.perez@espe.edu.ec",
    "0999999999",
    "jperez",
  ];

  const bom = "\ufeff";
  const csv =
    bom +
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

/** ===========================
 * Helpers
 * ===========================*/
function normKey(s: any) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sin tildes
    .replace(/\s+/g, "_");
}

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D+/g, "");
}

function isValidEmail(v: string) {
  // ✅ acepta .ec, .com, .edu.ec, etc.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? "").trim());
}

function pickNorm(r: Record<string, any>, keys: string[]) {
  for (const k of keys) {
    const kk = normKey(k);
    const val = r[kk];
    if (val !== undefined && val !== null && String(val).trim() !== "") return val;
  }
  return "";
}

function makeLabel(
  apellidos: string,
  nombres: string,
  idEspe: string,
  usuario: string
) {
  const full = `${(apellidos || "").trim()} ${(nombres || "").trim()}`.trim();
  const extra = idEspe ? idEspe : (usuario ? usuario : "");
  return extra ? `${full || "Docente"} (${extra})` : (full || "Docente");
}

function missingFieldsHuman(m: {
  idEspe: boolean;
  cedula: boolean;
  apellidos: boolean;
  nombres: boolean;
  correo: boolean;
  usuario: boolean;
}) {
  const faltan: string[] = [];
  if (m.idEspe) faltan.push("ID ESPE");
  if (m.cedula) faltan.push("Cédula");
  if (m.apellidos) faltan.push("Apellidos");
  if (m.nombres) faltan.push("Nombres");
  if (m.correo) faltan.push("Correo");
  if (m.usuario) faltan.push("Usuario");
  return `Faltan datos obligatorios: ${faltan.join(", ")}.`;
}

/** ===========================
 * Parse Excel con estadísticas
 * ===========================*/
export async function parseExcelDocentes(file: File): Promise<DocenteImportReport> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return {
      rows: [],
      issues: [{ rowNum: 0, docenteLabel: "Archivo", reason: "El Excel no tiene hojas." }],
      stats: { totalRows: 0, valid: 0, invalid: 1, duplicatesInFile: 0 },
    };
  }

  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

  if (!raw.length) {
    return {
      rows: [],
      issues: [{ rowNum: 0, docenteLabel: "Archivo", reason: "El Excel está vacío." }],
      stats: { totalRows: 0, valid: 0, invalid: 1, duplicatesInFile: 0 },
    };
  }

  // Normaliza keys de cada fila
  const normalizedRaw = raw.map((r) => {
    const out: Record<string, any> = {};
    Object.keys(r || {}).forEach((k) => (out[normKey(k)] = r[k]));
    return out;
  });

  const issues: DocenteImportIssue[] = [];
  const validRows: DocenteImportRow[] = [];

  // ✅ Para detectar duplicados dentro del Excel (por campos únicos)
  const seenCedula = new Set<string>();
  const seenCorreo = new Set<string>();
  const seenUsuario = new Set<string>();
  const seenIdEspe = new Set<string>();

  let duplicatesInFile = 0;

  normalizedRaw.forEach((r, idx) => {
    const rowNum = idx + 2;

    // Lee valores soportando encabezados "bonitos" y los técnicos
    const id_espe = String(
      pickNorm(r, ["ID_ESPE", "id_espe", "id_institucional_docente", "id institucional", "id"])
    ).trim();

    const cedulaRaw = String(pickNorm(r, ["CÉDULA", "CEDULA", "cedula", "cédula"])).trim();
    const cedula = onlyDigits(cedulaRaw);

    const apellidos = String(pickNorm(r, ["APELLIDOS", "apellidos", "apellidos_docente"])).trim();
    const nombres = String(pickNorm(r, ["NOMBRES", "nombres", "nombres_docente"])).trim();

    const correo = String(pickNorm(r, ["CORREO", "correo", "correo_docente", "email"])).trim();

    const telefonoRaw = String(
      pickNorm(r, ["TELÉFONO", "TELEFONO", "telefono", "telefono_docente", "celular"])
    ).trim();
    const telefono = onlyDigits(telefonoRaw);

    const usuario = String(
      pickNorm(r, ["USUARIO", "usuario", "nombre_usuario", "username"])
    ).trim();

    const label = makeLabel(apellidos, nombres, id_espe, usuario);

    // 1) Validar obligatorios (con mensajes humanos)
    const missing = {
      idEspe: !id_espe,
      cedula: !cedula,
      apellidos: !apellidos,
      nombres: !nombres,
      correo: !correo,
      usuario: !usuario,
    };

    if (missing.idEspe || missing.cedula || missing.apellidos || missing.nombres || missing.correo || missing.usuario) {
      issues.push({
        rowNum,
        docenteLabel: label,
        reason: missingFieldsHuman(missing),
      });
      return;
    }

    // 2) Validar correo
    if (!isValidEmail(correo)) {
      issues.push({
        rowNum,
        docenteLabel: label,
        reason: `Correo no válido: "${correo}".`,
      });
      return;
    }

    // 3) Duplicados dentro del Excel (simulando tus UNIQUE de BD)
    const keyCed = cedula;
    const keyCor = correo.toLowerCase();
    const keyUsr = usuario.toLowerCase();
    const keyId = id_espe.toUpperCase();

    const dupReasons: string[] = [];
    if (seenCedula.has(keyCed)) dupReasons.push("Cédula repetida en el Excel");
    if (seenCorreo.has(keyCor)) dupReasons.push("Correo repetido en el Excel");
    if (seenUsuario.has(keyUsr)) dupReasons.push("Usuario repetido en el Excel");
    if (seenIdEspe.has(keyId)) dupReasons.push("ID ESPE repetido en el Excel");

    if (dupReasons.length) {
      duplicatesInFile++;
      issues.push({
        rowNum,
        docenteLabel: label,
        reason: dupReasons.join(" / ") + ".",
      });
      return;
    }

    // marcar como visto
    seenCedula.add(keyCed);
    seenCorreo.add(keyCor);
    seenUsuario.add(keyUsr);
    seenIdEspe.add(keyId);

    // ✅ ok
    validRows.push({
      id_institucional_docente: id_espe,
      cedula,
      apellidos_docente: apellidos,
      nombres_docente: nombres,
      correo_docente: correo,
      telefono_docente: telefono ? telefono : undefined,
      nombre_usuario: usuario,
    });
  });

  const totalRows = normalizedRaw.length;
  const invalid = issues.length;
  const valid = validRows.length;

  return {
    rows: validRows,
    issues,
    stats: { totalRows, valid, invalid, duplicatesInFile },
  };
}
