// ✅ src/controllers/entregas_caso.controller.js
const path = require("path");
const fs = require("fs");
const service = require("../services/entregas_caso.service");

function httpErr(res, e) {
  const status = Number(e?.status || 500);
  return res.status(status).json({ ok: false, message: e?.message || "Error interno" });
}

/** ✅ CP viene del ctx.middleware (attachCarreraPeriodoCtx). */
function getCpFromReq(req) {
  return Number(req?.ctx?.id_carrera_periodo || 0);
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "entregas-caso");

// ✅ asegura carpeta
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function safeName(name = "") {
  return String(name)
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
}

/** ✅ igual que en casos_estudio: resuelve /uploads/... a path real y evita path traversal */
function resolveUploadsPath(publicPath) {
  const uploadsRoot = path.join(process.cwd(), "uploads");
  const rel = String(publicPath || "").replace(/^\/+/, "");
  const full = path.resolve(process.cwd(), rel);
  const root = path.resolve(uploadsRoot);

  if (!full.startsWith(root)) return null;
  return full;
}

/**
 * ✅ GET /entregas-caso/:id_estudiante
 * JSON metadata
 */
async function get(req, res) {
  try {
    const cp = getCpFromReq(req);
    const id_estudiante = Number(req.params.id_estudiante || 0);

    if (!cp) return res.status(400).json({ ok: false, message: "id_carrera_periodo requerido" });
    if (!id_estudiante) return res.status(400).json({ ok: false, message: "id_estudiante inválido" });

    const data = await service.get(cp, id_estudiante, req.user);
    return res.json({ ok: true, data });
  } catch (e) {
    return httpErr(res, e);
  }
}

/**
 * ✅ GET /entregas-caso/:id_estudiante/download
 * PDF inline (Ver/Descargar)
 */
async function download(req, res) {
  try {
    const cp = getCpFromReq(req);
    const id_estudiante = Number(req.params.id_estudiante || 0);

    if (!cp) return res.status(400).json({ ok: false, message: "id_carrera_periodo requerido" });
    if (!id_estudiante) return res.status(400).json({ ok: false, message: "id_estudiante inválido" });

    // ✅ valida permisos y existencia
    const entrega = await service.getForDownload(cp, id_estudiante, req.user);

    if (!entrega?.archivo_path) {
      return res.status(404).json({ ok: false, message: "La entrega no tiene archivo PDF." });
    }

    const fullPath = resolveUploadsPath(entrega.archivo_path);

    if (!fullPath || !fs.existsSync(fullPath)) {
      return res.status(404).json({
        ok: false,
        message: "Archivo PDF no encontrado en el servidor (archivo_path inválido o archivo borrado).",
      });
    }

    const filename = safeName(entrega.archivo_nombre || `entrega_${id_estudiante}.pdf`);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    return res.sendFile(fullPath);
  } catch (e) {
    return httpErr(res, e);
  }
}

/**
 * ✅ POST /entregas-caso/by-estudiante
 * Guarda archivo en /uploads/entregas-caso y persiste archivo_path en DB
 */
async function upsert(req, res) {
  try {
    const cp = getCpFromReq(req);
    if (!cp) return res.status(400).json({ ok: false, message: "id_carrera_periodo requerido" });

    const id_estudiante = Number(req.body.id_estudiante || 0);
    if (!id_estudiante) return res.status(400).json({ ok: false, message: "id_estudiante inválido" });

    if (!req.file) {
      return res.status(422).json({
        ok: false,
        message: "Validación fallida",
        errors: [{ field: "archivo", msg: "Debe adjuntar el PDF de la entrega" }],
      });
    }

    const original = req.file.originalname || "entrega.pdf";
    const isPdf =
      req.file.mimetype === "application/pdf" || String(original).toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return res.status(422).json({
        ok: false,
        message: "Validación fallida",
        errors: [{ field: "archivo", msg: "Solo se permite archivo PDF." }],
      });
    }

    // ✅ nombre físico único
    const filename = `${Date.now()}_${safeName(original)}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // ✅ guarda buffer (multer.memoryStorage)
    fs.writeFileSync(filepath, req.file.buffer);

    const payload = {
      id_estudiante,
      archivo_nombre: original,
      archivo_path: `/uploads/entregas-caso/${filename}`, // ✅ path público
      observacion: req.body.observacion ? String(req.body.observacion) : null,
    };

    const saved = await service.upsert(cp, payload, req.user);
    return res.json({ ok: true, data: saved, message: "Entrega guardada" });
  } catch (e) {
    return httpErr(res, e);
  }
}

module.exports = { get, download, upsert };
