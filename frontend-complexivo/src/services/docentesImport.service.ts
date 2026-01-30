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
  rowNum: number;
  docenteLabel: string;
  reason: string;
};

export type DocenteImportReport = {
  rows: DocenteImportRow[];
  issues: DocenteImportIssue[];
  stats: {
    totalRows: number;
    valid: number;
    invalid: number;
    duplicatesInFile: number;
  };
};

/** ===========================
 * Plantilla CSV (Excel-friendly)
 * ===========================*/
export function downloadPlantillaDocentesCSV() {
  // Encabezados "humanos"
  const headers = ["ID_ESPE", "CÉDULA", "APELLIDOS", "NOMBRES", "CORREO", "TELÉFONO", "USUARIO"];

  const example = [
    "L00",
    "1711111111",
    "PÉREZ",
    "JUAN",
    "juan.perez@espe.edu.ec",
    "0999999999",
    "jperez",
  ];

  // ✅ BOM para que Excel lea bien tildes/ñ
  const bom = "\ufeff";

  // ✅ separador ; (clave para Excel en configuración ES)
  const sep = ";";

  const line = (arr: any[]) => arr.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(sep);

  const csv = bom + line(headers) + "\n" + line(example) + "\n";

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
 * Plantilla XLSX (bonita)
 * ===========================*/
export function downloadPlantillaDocentesXLSX() {
  const headers = ["ID_ESPE", "CÉDULA", "APELLIDOS", "NOMBRES", "CORREO", "TELÉFONO", "USUARIO"];

  const example = [
    ["L00", "1711111111", "PÉREZ", "JUAN", "juan.perez@espe.edu.ec", "0999999999", "jperez"],
  ];

  const data = [headers, ...example];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // ✅ ancho de columnas (se ve “bonito”)
  ws["!cols"] = [
    { wch: 10 }, // ID_ESPE
    { wch: 12 }, // CEDULA
    { wch: 20 }, // APELLIDOS
    { wch: 20 }, // NOMBRES
    { wch: 28 }, // CORREO
    { wch: 14 }, // TELEFONO
    { wch: 16 }, // USUARIO
  ];

  // ✅ congelar encabezado
  ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" } as any;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DOCENTES");

  XLSX.writeFile(wb, "plantilla_docentes.xlsx");
}

/* ===========================
   Helpers del parse (los tuyos)
   =========================== */
function normKey(s: any) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D+/g, "");
}

function isValidEmail(v: string) {
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

function makeLabel(apellidos: string, nombres: string, idEspe: string, usuario: string) {
  const full = `${(apellidos || "").trim()} ${(nombres || "").trim()}`.trim();
  const extra = idEspe ? idEspe : usuario ? usuario : "";
  return extra ? `${full || "Docente"} (${extra})` : full || "Docente";
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
 * Parse (tu función real se llama parseFileDocentes)
 * ✅ dejo aquí un ejemplo con la firma; si ya la tienes, NO la dupliques.
 * ===========================*/
export async function parseFileDocentes(file: File): Promise<DocenteImportReport> {
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

  const normalizedRaw = raw.map((r) => {
    const out: Record<string, any> = {};
    Object.keys(r || {}).forEach((k) => (out[normKey(k)] = r[k]));
    return out;
  });

  const issues: DocenteImportIssue[] = [];
  const validRows: DocenteImportRow[] = [];

  const seenCedula = new Set<string>();
  const seenCorreo = new Set<string>();
  const seenUsuario = new Set<string>();
  const seenIdEspe = new Set<string>();

  let duplicatesInFile = 0;

  normalizedRaw.forEach((r, idx) => {
    const rowNum = idx + 2;

    const id_espe = String(pickNorm(r, ["ID_ESPE", "id_espe", "id_institucional_docente", "id"])).trim();
    const cedulaRaw = String(pickNorm(r, ["CÉDULA", "CEDULA", "cedula", "cédula"])).trim();
    const cedula = onlyDigits(cedulaRaw);

    const apellidos = String(pickNorm(r, ["APELLIDOS", "apellidos", "apellidos_docente"])).trim();
    const nombres = String(pickNorm(r, ["NOMBRES", "nombres", "nombres_docente"])).trim();
    const correo = String(pickNorm(r, ["CORREO", "correo", "correo_docente", "email"])).trim();

    const telefonoRaw = String(pickNorm(r, ["TELÉFONO", "TELEFONO", "telefono", "celular"])).trim();
    const telefono = onlyDigits(telefonoRaw);

    const usuario = String(pickNorm(r, ["USUARIO", "usuario", "nombre_usuario", "username"])).trim();

    const label = makeLabel(apellidos, nombres, id_espe, usuario);

    const missing = {
      idEspe: !id_espe,
      cedula: !cedula,
      apellidos: !apellidos,
      nombres: !nombres,
      correo: !correo,
      usuario: !usuario,
    };

    if (missing.idEspe || missing.cedula || missing.apellidos || missing.nombres || missing.correo || missing.usuario) {
      issues.push({ rowNum, docenteLabel: label, reason: missingFieldsHuman(missing) });
      return;
    }

    if (!isValidEmail(correo)) {
      issues.push({ rowNum, docenteLabel: label, reason: `Correo no válido: "${correo}".` });
      return;
    }

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
      issues.push({ rowNum, docenteLabel: label, reason: dupReasons.join(" / ") + "." });
      return;
    }

    seenCedula.add(keyCed);
    seenCorreo.add(keyCor);
    seenUsuario.add(keyUsr);
    seenIdEspe.add(keyId);

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

  return {
    rows: validRows,
    issues,
    stats: {
      totalRows: normalizedRaw.length,
      valid: validRows.length,
      invalid: issues.length,
      duplicatesInFile,
    },
  };
}
