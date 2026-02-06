// src/routes/casos_estudio.routes.js
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");
const ctrl = require("../controllers/casos_estudio.controller");

const multer = require("multer");

// ✅ Para poder usar req.file.buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// ✅ LISTAR casos
// GET /api/casos-estudio?includeInactive=true|false
router.get(
  "/",
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.list
);

// ✅ CREAR caso (con PDF)
// POST /api/casos-estudio  (FormData con "archivo")
router.post(
  "/",
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  upload.single("archivo"),
  body("numero_caso").isInt({ min: 1 }).toInt(),
  body("titulo").optional().isString().isLength({ max: 150 }),
  body("descripcion").optional().isString().isLength({ max: 500 }),
  validate,
  ctrl.create
);

// ✅ UPDATE caso (PDF opcional)
// PUT /api/casos-estudio/:id_caso_estudio
router.put(
  "/:id_caso_estudio",
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  upload.single("archivo"),
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  body("numero_caso").optional().isInt({ min: 1 }).toInt(),
  body("titulo").optional().isString().isLength({ max: 150 }),
  body("descripcion").optional().isString().isLength({ max: 500 }),
  validate,
  ctrl.update
);

// ✅ PATCH estado
// PATCH /api/casos-estudio/:id_caso_estudio/estado
router.patch(
  "/:id_caso_estudio/estado",
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.toggleEstado
);

module.exports = router;
