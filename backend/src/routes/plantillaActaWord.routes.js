const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const ctrl = require("../controllers/plantillaActaWord.controller");

const router = express.Router();

// uploads/plantillas-acta (desde la raíz donde está app.js)
const uploadDir = path.join(process.cwd(), "uploads", "plantillas-acta");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || ".docx");
    const base = path.basename(file.originalname || "plantilla", ext).replace(/\s+/g, "_");
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
