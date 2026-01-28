const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const ctrl = require("../controllers/plantillaActaWord.controller");

const router = express.Router();

/**
 * ✅ Upload dir seguro:
 * - Render: /tmp/uploads/plantillas-acta  (escribible)
 * - Local:  <carpeta backend>/uploads/plantillas-acta
 *
 * process.cwd() en tu caso normalmente es backend (porque tu app.js está en backend/)
 */
const baseUploads =
  process.env.UPLOADS_DIR ||
  (process.env.RENDER ? "/tmp/uploads" : path.join(process.cwd(), "uploads"));

const uploadDir = path.join(baseUploads, "plantillas-acta");

// Crear carpetas si no existen
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const original = file.originalname || "plantilla.docx";
    const ext = path.extname(original) || ".docx";
    const base = path
      .basename(original, ext)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, ""); // ✅ evita caracteres raros
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

function fileFilter(_, file, cb) {
  const name = (file.originalname || "").toLowerCase();
  if (!name.endsWith(".docx")) return cb(new Error("Solo se permite .docx"));
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/", ctrl.list);
router.post("/", upload.single("file"), ctrl.create);
router.patch("/:id/activar", ctrl.activar);
router.delete("/:id", ctrl.remove);
router.get("/:id/download", ctrl.download);

module.exports = router;
