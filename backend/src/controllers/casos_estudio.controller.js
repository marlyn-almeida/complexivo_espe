// src/controllers/casos_estudio.controller.js
const svc = require("../services/casos_estudio.service");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/casos-estudio");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function safeName(name = "") {
  return String(name)
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
}

function resolveUploadsPath(publicPath) {
  // publicPath esperado: "/uploads/casos-estudio/xxx.pdf"
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const rel = String(publicPath || "").replace(/^\/+/, "");
  const full = path.resolve(process.cwd(), rel);
  const root = path.resolve(uploadsRoot);
  if (!full.startsWith(root)) return null;
  return full;
}

async function list(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const includeInactive = Boolean(req.query.includeInactive);
    const data = await svc.list(cp, includeInactive);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);

    if (!req.file) {
      return res.status(422).json({
        ok: false,
        message: "Validación fallida",
        errors: [{ field: "archivo", msg: "Debe adjuntar el PDF del caso de estudio" }],
      });
    }

    const original = req.file.originalname || "caso.pdf";
    const isPdf =
      req.file.mimetype === "application/pdf" ||
      String(original).toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return res.status(422).json({
        ok: false,
        message: "Validación fallida",
        errors: [{ field: "archivo", msg: "Solo se permite archivo PDF." }],
      });
    }

    const filename = `${Date.now()}_${safeName(original)}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const payload = {
      numero_caso: Number(req.body.numero_caso),
      titulo: req.body.titulo ? String(req.body.titulo) : null,
      descripcion: req.body.descripcion ? String(req.body.descripcion) : null,
      archivo_nombre: original,
      archivo_path: `/uploads/casos-estudio/${filename}`,
    };

    const id = await svc.create(cp, payload);
    res.status(201).json({ ok: true, id });
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_caso_estudio = Number(req.params.id_caso_estudio);

    const patch = {
      numero_caso: req.body.numero_caso !== undefined ? Number(req.body.numero_caso) : undefined,
      titulo: req.body.titulo !== undefined ? String(req.body.titulo) : undefined,
      descripcion: req.body.descripcion !== undefined ? String(req.body.descripcion) : undefined,
    };

    if (req.file) {
      const original = req.file.originalname || "caso.pdf";
      const isPdf =
        req.file.mimetype === "application/pdf" ||
        String(original).toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        return res.status(422).json({
          ok: false,
          message: "Validación fallida",
          errors: [{ field: "archivo", msg: "Solo se permite archivo PDF." }],
        });
      }

      const filename = `${Date.now()}_${safeName(original)}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filepath, req.file.buffer);

      patch.archivo_nombre = original;
      patch.archivo_path = `/uploads/casos-estudio/${filename}`;
    }

    await svc.update(cp, id_caso_estudio, patch);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function toggleEstado(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_caso_estudio = Number(req.params.id_caso_estudio);

    await svc.update(cp, id_caso_estudio, { estado: req.body.estado });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

// ✅ NUEVO: descargar PDF base del caso
async function download(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_caso_estudio = Number(req.params.id_caso_estudio);

    const caso = await svc.getByIdForDownload(cp, id_caso_estudio, req.user);

    if (!caso?.archivo_path) {
      const err = new Error("Caso sin archivo.");
      err.status = 404;
      throw err;
    }

    const fullPath = resolveUploadsPath(caso.archivo_path);
    if (!fullPath || !fs.existsSync(fullPath)) {
      const err = new Error("Archivo no encontrado en el servidor.");
      err.status = 404;
      throw err;
    }

    const downloadName = safeName(caso.archivo_nombre || `caso_${caso.numero_caso}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.download(fullPath, downloadName);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, update, toggleEstado, download };
