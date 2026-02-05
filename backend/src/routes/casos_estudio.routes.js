// src/routes/casos_estudio.routes.js
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");
const ctrl = require("../controllers/casos_estudio.controller");

const multer = require("multer");

// ✅ Para poder usar req.file.buffer (como tu controller)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB (ajusta si quieres)
});

router.get(
  "/",
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.list
);

router.post(
  "/",
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  upload.single("archivo"), // 👈 el FormData debe mandar "archivo"
  body("numero_caso").isInt({ min: 1 }).toInt(),
  body("titulo").optional().isString().isLength({ max: 150 }),
  body("descripcion").optional().isString().isLength({ max: 500 }),
  validate,
  ctrl.create
);

router.put(
  "/:id_caso_estudio",
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  upload.single("archivo"), // 👈 opcional en update
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  body("numero_caso").optional().isInt({ min: 1 }).toInt(),
  body("titulo").optional().isString().isLength({ max: 150 }),
  body("descripcion").optional().isString().isLength({ max: 500 }),
  validate,
  ctrl.update
);

// ✅ PATCH estado (ACTIVAR/DESACTIVAR)
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
