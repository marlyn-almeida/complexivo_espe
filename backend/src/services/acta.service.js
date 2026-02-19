// src/services/acta.service.js
const path = require("path");
const fs = require("fs");

const pool = require("../config/db");
const actaRepo = require("../repositories/acta.repo");
const calRepo = require("../repositories/calificacion.repo");
const calService = require("./calificacion.service");

const { docxToPdf } = require("../utils/docxToPdf");

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

function round2(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  return Number(num.toFixed(2));
}

function formatFechaBarra(dateISO) {
  const d = dateISO instanceof Date ? dateISO : new Date(dateISO);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function letrasSimple(n) {
  return `${Number(n).toFixed(2)} / 20`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function resolveUploadsPath(publicPath) {
  // publicPath: "/uploads/plantillas/xxx.docx" o "uploads/..."
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const rel = String(publicPath || "").replace(/^\/+/, "");
  const full = path.resolve(process.cwd(), rel);
  const root = path.resolve(uploadsRoot);
  if (!full.startsWith(root)) return null;
  return full;
}

// ✅ helper: tomar id docente de forma robusta
function pickDocenteId(user) {
  const v =
    user?.id_docente ??
    user?.idDocente ??
    user?.docente_id ??
    user?.id; // fallback
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * ✅ Lee plantilla_acta_word activa y genera DOCX + (opcional) PDF
 * Plantilla con delimitadores ${variable}
 */
async function generarWordDesdePlantilla({ actaVars, outputBaseName }) {
  const plantilla = await actaRepo.getPlantillaActiva();
  if (!plantilla?.archivo_path) return { docx: null, pdf: null, plantilla: null };

  const fullPlantilla = resolveUploadsPath(plantilla.archivo_path);
  if (!fullPlantilla || !fs.existsSync(fullPlantilla)) {
    throw err("Plantilla activa no encontrada en el servidor.", 404);
  }

  let PizZip, Docxtemplater;
  try {
    PizZip = require("pizzip");
    Docxtemplater = require("docxtemplater");
  } catch {
    throw err("Faltan dependencias: instala docxtemplater y pizzip.", 500);
  }

  const content = fs.readFileSync(fullPlantilla, "binary");
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "${", end: "}" },
  });

  doc.setData(actaVars);

  try {
    doc.render();
  } catch (e) {
    const msg = e?.message || "Error renderizando plantilla";
    throw err(`Error al renderizar plantilla: ${msg}`, 500);
  }

  const buf = doc.getZip().generate({ type: "nodebuffer" });

  const outDir = path.join(process.cwd(), "uploads", "actas");
  ensureDir(outDir);

  const outDocx = path.join(outDir, `${outputBaseName}.docx`);
  fs.writeFileSync(outDocx, buf);

  // PDF opcional
  const outPdf = path.join(outDir, `${outputBaseName}.pdf`);
  const cssPath = path.join(process.cwd(), "src", "templates", "acta-pdf.css");

  let pdfPublic = null;
  try {
    await docxToPdf({ docxPath: outDocx, pdfPath: outPdf, cssPath });
    pdfPublic = `/uploads/actas/${outputBaseName}.pdf`;
  } catch {
    pdfPublic = null;
  }

  return {
    plantilla: { id_plantilla: plantilla.id_plantilla, nombre: plantilla.nombre },
    docx: `/uploads/actas/${outputBaseName}.docx`,
    pdf: pdfPublic,
  };
}

/**
 * ✅ Genera Acta desde tribunal_estudiante:
 */
async function generarDesdeTribunalEstudiante(
  { id_tribunal_estudiante, id_rubrica, fecha_acta = null, umbral_aprobacion = 14 },
  user
) {
  await calService.validarCoherencia(id_tribunal_estudiante, id_rubrica);

  const ctx = await actaRepo.getContextTribunal(id_tribunal_estudiante);
  if (!ctx) throw err("tribunal_estudiante no encontrado", 404);

  // ✅ REGLA: SOLO si está cerrado
  if (Number(ctx.cerrado) !== 1) {
    throw err("No se puede generar el acta: el caso/asignación aún no está cerrada.", 409);
  }

  const cp = Number(ctx.id_carrera_periodo);
  const id_estudiante = Number(ctx.id_estudiante);

  const notaTeo = await actaRepo.getNotaTeorico(cp, id_estudiante);
  if (!notaTeo) throw err("No existe nota teórica registrada para este estudiante en este carrera-período.", 422);

  const nota_teorico_20 = round2(notaTeo.nota_teorico_20);

  const escrita = await calRepo.findOneByKey(id_tribunal_estudiante, id_rubrica, "PRACTICO_ESCRITA");
  const oral = await calRepo.findOneByKey(id_tribunal_estudiante, id_rubrica, "PRACTICO_ORAL");

  const nota_practico_escrita_20 = escrita ? round2(escrita.nota_base20) : null;
  const nota_practico_oral_20 = oral ? round2(oral.nota_base20) : null;

  if (nota_practico_escrita_20 === null && nota_practico_oral_20 === null) {
    throw err("No existen calificaciones prácticas (ESCRITA/ORAL) para generar el acta.", 422);
  }

  const cfg = await actaRepo.getConfigPonderacion(cp);

  const peso_teorico_final_pct = round2(cfg.peso_teorico_final_pct);
  const peso_practico_final_pct = round2(cfg.peso_practico_final_pct);
  const peso_practico_escrito_pct = round2(cfg.peso_practico_escrito_pct);
  const peso_practico_oral_pct = round2(cfg.peso_practico_oral_pct);

  let practico_20 = null;
  if (nota_practico_escrita_20 !== null && nota_practico_oral_20 !== null) {
    practico_20 = round2(
      nota_practico_escrita_20 * (peso_practico_escrito_pct / 100) +
        nota_practico_oral_20 * (peso_practico_oral_pct / 100)
    );
  } else if (nota_practico_escrita_20 !== null) {
    practico_20 = round2(nota_practico_escrita_20);
  } else {
    practico_20 = round2(nota_practico_oral_20);
  }

  const calificacion_teorico_ponderada = round2(nota_teorico_20 * (peso_teorico_final_pct / 100));
  const calificacion_practico_ponderada = round2(practico_20 * (peso_practico_final_pct / 100));
  const final_20 = round2((calificacion_teorico_ponderada ?? 0) + (calificacion_practico_ponderada ?? 0));

  const aprobacion = final_20 >= Number(umbral_aprobacion) ? 1 : 0;

  const calFinal = await calRepo.upsertByKey({
    id_tribunal_estudiante,
    id_rubrica,
    tipo_rubrica: "FINAL",
    nota_base20: final_20,
    observacion: "Generada automáticamente para acta",
  });

  const payloadActa = {
    id_calificacion: calFinal.id_calificacion,
    nota_teorico_20,
    nota_practico_escrita_20,
    nota_practico_oral_20,
    calificacion_final: final_20,
    calificacion_final_letras: letrasSimple(final_20),
    aprobacion,
    fecha_acta: fecha_acta ? String(fecha_acta).slice(0, 10) : null,
    estado_acta: "BORRADOR",
  };

  const existente = await actaRepo.findByCalificacion(calFinal.id_calificacion);
  const acta = existente
    ? await actaRepo.updateById(existente.id_acta, payloadActa)
    : await actaRepo.create(payloadActa);

  const tribunalDocentes = await actaRepo.getDocentesTribunal(Number(ctx.id_tribunal));
  const director = await actaRepo.getDirectorCP(cp);

  const actaVars = {
    aprobado_si: aprobacion ? "X" : "",
    aprobado_no: aprobacion ? "" : "X",

    nota_teorico_sobre_20: nota_teorico_20 ?? "",
    ponderacion_teorico: peso_teorico_final_pct ?? "",
    ponderacion_practico: peso_practico_final_pct ?? "",

    componente1_nota: nota_practico_escrita_20 ?? "",
    componente1_ponderacion: peso_practico_escrito_pct ?? "",
    componente1_calificacion_ponderada:
      nota_practico_escrita_20 !== null ? round2(nota_practico_escrita_20 * (peso_practico_escrito_pct / 100)) : "",

    componente2_nota: nota_practico_oral_20 ?? "",
    componente2_ponderacion: peso_practico_oral_pct ?? "",
    componente2_calificacion_ponderada:
      nota_practico_oral_20 !== null ? round2(nota_practico_oral_20 * (peso_practico_oral_pct / 100)) : "",

    calificacion_teorico_ponderada: calificacion_teorico_ponderada ?? "",
    calificacion_practico_ponderada: calificacion_practico_ponderada ?? "",

    nota_final: final_20 ?? "",
    nota_final_letras: letrasSimple(final_20),

    estudiante_id: ctx.id_institucional_estudiante ?? "",
    estudiante_nombre_completo: `${ctx.nombres_estudiante} ${ctx.apellidos_estudiante}`.trim(),

    carrera_nombre_procesado: ctx.carrera_nombre ?? "",
    carrera_modalidad: ctx.carrera_modalidad ?? "",

    fecha_formato_barra: formatFechaBarra(payloadActa.fecha_acta || ctx.fecha_examen),

    presidente_nombre: tribunalDocentes.PRESIDENTE?.nombre ?? "",
    presidente_cedula: tribunalDocentes.PRESIDENTE?.cedula ?? "",
    integrante1_nombre: tribunalDocentes.INTEGRANTE_1?.nombre ?? "",
    integrante1_cedula: tribunalDocentes.INTEGRANTE_1?.cedula ?? "",
    integrante2_nombre: tribunalDocentes.INTEGRANTE_2?.nombre ?? "",
    integrante2_cedula: tribunalDocentes.INTEGRANTE_2?.cedula ?? "",

    director_nombre: director?.nombre ?? "",
    director_cedula: director?.cedula ?? "",
  };

  const base = `acta_${acta.id_acta}_${ctx.id_institucional_estudiante}`;

  const files = await generarWordDesdePlantilla({
    actaVars,
    outputBaseName: base,
  });

  // ✅ persistir docx/pdf en BD
  try {
    await actaRepo.setArchivosGenerados(
      acta.id_acta,
      files?.docx ?? null,
      files?.pdf ?? null,
      `${base}.docx`,
      files?.pdf ? `${base}.pdf` : null
    );
  } catch (e) {
    console.error("⚠️ No se pudo guardar archivo_docx/pdf_path en acta:", e);
  }

  return {
    acta: await actaRepo.findById(acta.id_acta),
    calculos: {
      nota_teorico_20,
      nota_practico_escrita_20,
      nota_practico_oral_20,
      practico_20,
      peso_teorico_final_pct,
      peso_practico_final_pct,
      peso_practico_escrito_pct,
      peso_practico_oral_pct,
      calificacion_teorico_ponderada,
      calificacion_practico_ponderada,
      final_20,
      umbral_aprobacion,
      aprobacion,
    },
    archivos: files,
  };
}

// ✅ subir acta firmada (solo presidente)
async function subirActaFirmada(id_acta, file, user) {
  const acta = await actaRepo.findById(Number(id_acta));
  if (!acta) throw err("Acta no encontrada", 404);

  const docenteId = pickDocenteId(user);
  if (!docenteId) throw err("No se pudo identificar el docente autenticado.", 401);

  const ok = await actaRepo.isPresidenteDeActa(Number(id_acta), Number(docenteId));
  if (!ok) throw err("Solo el PRESIDENTE del tribunal puede subir el acta firmada.", 403);

  const publicPath = `/uploads/actas-firmadas/${file.filename}`;
  const originalName = file.originalname || file.filename;

  const updated = await actaRepo.setActaFirmada(
    Number(id_acta),
    publicPath,
    originalName,
    Number(docenteId)
  );

  return updated;
}

async function get(id) {
  const a = await actaRepo.findById(id);
  if (!a) throw err("Acta no encontrada", 404);
  return a;
}

async function changeEstado(id, estado) {
  await get(id);
  return actaRepo.setEstado(id, estado);
}

module.exports = { generarDesdeTribunalEstudiante, subirActaFirmada, get, changeEstado };
