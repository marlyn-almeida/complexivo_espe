// src/middlewares/uploadActaFirmada.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const ACTAS_FIRMADAS_DIR = path.join(UPLOADS_ROOT, "actas-firmadas");

try {
  if (!fs.existsSync(ACTAS_FIRMADAS_DIR)) fs.mkdirSync(ACTAS_FIRMADAS_DIR, { recursive: true });
} catch (e) {
  console.error("⚠️ No se pudo crear carpeta actas-firmadas:", e);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ACTAS_FIRMADAS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".pdf";
    const name = `acta_firmada_${req.params.id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

function fileFilter(req, file, cb) {
  const okMime = file.mimetype === "application/pdf";
  const okExt = String(path.extname(file.originalname || "")).toLowerCase() === ".pdf";

  if (!okMime && !okExt) return cb(new Error("Solo se permite subir archivos PDF."));
  cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});
