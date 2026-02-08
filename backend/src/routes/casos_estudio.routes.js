// ✅ src/routes/casos_estudio.routes.js
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize, auth } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");
const ctrl = require("../controllers/casos_estudio.controller");

const multer = require("multer");

// ✅ Para poder usar req.file.buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// ✅ LISTAR casos
router.get(
  "/",
  auth,
  authorize(["ADMIN", "DOCENTE"]),
  attachCarreraPeriodoCtx,
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.list
);

// ✅ DOWNLOAD PDF del caso base
router.get(
  "/:id_caso_estudio/download",
  auth,
  authorize(["ADMIN", "DOCENTE"]),
  attachCarreraPeriodoCtx,
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.download
);

// ✅ CREAR caso (con PDF)
router.post(
  "/",
  auth,
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
router.put(
  "/:id_caso_estudio",
  auth,
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

// ✅ PATCH estado (mantienes tu papelera si quieres)
router.patch(
  "/:id_caso_estudio/estado",
  auth,
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.toggleEstado
);

// ✅ ✅ NUEVO: DELETE REAL (borra BD + PDF) SOLO ADMIN
router.delete(
  "/:id_caso_estudio",
  auth,
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.remove
);

module.exports = router;
