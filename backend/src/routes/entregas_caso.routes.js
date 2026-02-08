// ✅ src/routes/entregas_caso.routes.js
const router = require("express").Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize, auth } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");
const ctrl = require("../controllers/entregas_caso.controller");

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// ✅ JSON de la entrega (puede ser null)
router.get(
  "/:id_estudiante/:id_caso_estudio",
  auth,
  authorize(["ADMIN", "DOCENTE"]),
  attachCarreraPeriodoCtx,
  param("id_estudiante").isInt({ min: 1 }).toInt(),
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

// ✅ ✅ ✅ Ver PDF inline (por estudiante + caso)
router.get(
  "/:id_estudiante/:id_caso_estudio/download",
  auth,
  authorize(["ADMIN", "DOCENTE"]),
  attachCarreraPeriodoCtx,
  param("id_estudiante").isInt({ min: 1 }).toInt(),
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.download
);

// ✅ SUBIR/ACTUALIZAR PDF desde el front
router.post(
  "/",
  auth,
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  upload.single("archivo"),
  body("id_estudiante").isInt({ min: 1 }).toInt(),
  body("id_caso_estudio").isInt({ min: 1 }).toInt(),
  body("observacion").optional().isString().isLength({ max: 400 }),
  validate,
  ctrl.upsert
);

module.exports = router;
