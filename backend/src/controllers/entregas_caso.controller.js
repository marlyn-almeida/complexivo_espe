// src/controllers/entregas_caso.controller.js
const path = require("path");
const fs = require("fs");
const svc = require("../services/entregas_caso.service");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeName(name = "") {
  return String(name)
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
}

async function get(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_estudiante = Number(req.params.id_estudiante);
    const id_caso_estudio = Number(req.params.id_caso_estudio);

    const data = await svc.get(cp, id_estudiante, id_caso_estudio, req.user);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function upsert(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);

    // ✅ aquí sí viene el PDF
    if (!req.file) {
      const err = new Error("Archivo PDF requerido (campo: archivo)");
      err.status = 422;
      throw err;
    }

    // Validación básica
    const original = req.file.originalname || "entrega.pdf";
    const isPdf =
      req.file.mimetype === "application/pdf" ||
      String(original).toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      const err = new Error("Solo se permite archivo PDF.");
      err.status = 422;
      throw err;
    }

    const id_estudiante = Number(req.body.id_estudiante);
    const id_caso_estudio = Number(req.body.id_caso_estudio);
    const observacion = req.body.observacion;

    // ✅ nombre + path
    const uploadsRoot = path.join(process.cwd(), "uploads", "entregas-caso");
    ensureDir(uploadsRoot);

    const ts = Date.now();
    const filename = `${id_estudiante}_${id_caso_estudio}_${ts}_${safeName(original)}`;
    const fullPath = path.join(uploadsRoot, filename);

    fs.writeFileSync(fullPath, req.file.buffer);

    const body = {
      id_estudiante,
      id_caso_estudio,
      archivo_nombre: original,
      archivo_path: `/uploads/entregas-caso/${filename}`,
      observacion,
    };

    const saved = await svc.upsert(cp, body, req.user);
    res.json({ ok: true, data: saved });
  } catch (e) {
    next(e);
  }
}

// ✅ NUEVO: download del PDF de la entrega del estudiante
async function download(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_estudiante = Number(req.params.id_estudiante);
    const id_caso_estudio = Number(req.params.id_caso_estudio);

    const entrega = await svc.getForDownload(cp, id_estudiante, id_caso_estudio, req.user);

    if (!entrega?.archivo_path) {
      const err = new Error("La entrega no tiene archivo PDF.");
      err.status = 404;
      throw err;
    }

    // archivo_path guardado como "/uploads/entregas-caso/xxxx.pdf"
    const rel = String(entrega.archivo_path).replace(/^\/+/, "");
    const abs = path.join(process.cwd(), rel);

    if (!fs.existsSync(abs)) {
      const err = new Error("Archivo no encontrado en el servidor.");
      err.status = 404;
      throw err;
    }

    // nombre sugerido
    const suggested =
      entrega.archivo_nombre ||
      `entrega_${id_estudiante}_${id_caso_estudio}.pdf`;

    res.download(abs, suggested);
  } catch (e) {
    next(e);
  }
}

module.exports = { get, upsert, download };
