// src/routes/estudiante_caso_asignacion.routes.js
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");
const ctrl = require("../controllers/estudiante_caso_asignacion.controller");

// ✅ LISTAR (por CP)
// GET /api/estudiante-caso-asignacion?includeInactive=true|false
router.get(
  "/",
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.list
);

// ✅ ASIGNAR/REASIGNAR (UPSERT)
// POST /api/estudiante-caso-asignacion
router.post(
  "/",
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  body("id_estudiante").isInt({ min: 1 }).toInt(),
  body("id_caso_estudio").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.upsert
);

// ✅ ACTIVAR/DESACTIVAR POR ESTUDIANTE
// PATCH /api/estudiante-caso-asignacion/:id_estudiante/estado
router.patch(
  "/:id_estudiante/estado",
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  param("id_estudiante").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
