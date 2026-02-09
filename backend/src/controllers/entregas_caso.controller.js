// ✅ src/controllers/entregas_caso.controller.js
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

function resolveUploadsPath(publicPath) {
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const rel = String(publicPath || "").replace(/^\/+/, "");
  const full = path.resolve(process.cwd(), rel);
  const root = path.resolve(uploadsRoot);

  if (!full.startsWith(root)) return null;
  return full;
}

async function get(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_estudiante = Number(req.params.id_estudiante);

    const data = await svc.get(cp, id_estudiante, req.user);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function upsert(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);

    if (!req.file) {
      const err = new Error("Archivo PDF requerido (campo: archivo)");
      err.status = 422;
      throw err;
    }

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
    const observacion = req.body.observacion;

    const uploadsRoot = path.join(process.cwd(), "uploads", "entregas");
    ensureDir(uploadsRoot);

    const ts = Date.now();
    const filename = `${id_estudiante}_${ts}_${safeName(original)}`;
    const fullPath = path.join(uploadsRoot, filename);

    fs.writeFileSync(fullPath, req.file.buffer);

    const body = {
      id_estudiante,
      archivo_nombre: original,
      archivo_path: `/uploads/entregas/${filename}`,
      observacion,
    };

    const saved = await svc.upsert(cp, body, req.user);
    res.json({ ok: true, data: saved });
  } catch (e) {
    next(e);
  }
}

async function download(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_estudiante = Number(req.params.id_estudiante);

    const entrega = await svc.getForDownload(cp, id_estudiante, req.user);

    if (!entrega?.archivo_path) {
      const err = new Error("La entrega no tiene archivo PDF.");
      err.status = 404;
      throw err;
    }

    const fullPath = resolveUploadsPath(entrega.archivo_path);
    if (!fullPath || !fs.existsSync(fullPath)) {
      const err = new Error("Archivo no encontrado en el servidor.");
      err.status = 404;
      throw err;
    }

    const filename = safeName(entrega.archivo_nombre || `entrega_${id_estudiante}.pdf`);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    return res.sendFile(fullPath);
  } catch (e) {
    next(e);
  }
}

module.exports = { get, upsert, download };
