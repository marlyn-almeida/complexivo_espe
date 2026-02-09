// src/routes/calificacion.routes.js
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/calificacion.controller");
const { authorize } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");

// ✅ Necesitamos CP por header
router.use(attachCarreraPeriodoCtx);

// =======================
// ADMIN / SUPER_ADMIN (lo que ya tenías)
// =======================
router.get(
  "/",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("tribunalEstudianteId").optional().isInt({ min: 1 }).toInt(),
  query("rubricaId").optional().isInt({ min: 1 }).toInt(),
  validate,
  ctrl.list
);

router.get(
  "/:id",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

router.post(
  "/",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  body("id_tribunal_estudiante").isInt({ min: 1 }).toInt(),
  body("id_rubrica").isInt({ min: 1 }).toInt(),
  body("tipo_rubrica").isString().trim().notEmpty(),
  body("nota_base20").isDecimal(),
  body("observacion").optional().isString(),
  validate,
  ctrl.create
);

router.put(
  "/:id",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  body("tipo_rubrica").isString().trim().notEmpty(),
  body("nota_base20").isDecimal(),
  body("observacion").optional().isString(),
  validate,
  ctrl.update
);

router.patch(
  "/:id/estado",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

// =======================
// ✅ DOCENTE (ROL 3) - Panel de notas tribunal
// =======================

// Ver lo que me toca calificar (según Plan + designación)
router.get(
  "/mis/:id_tribunal_estudiante",
  authorize(["DOCENTE"]),
  param("id_tribunal_estudiante").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.misCalificaciones
);

// Guardar calificación por criterios (upsert)
router.post(
  "/mis/:id_tribunal_estudiante",
  authorize(["DOCENTE"]),
  param("id_tribunal_estudiante").isInt({ min: 1 }).toInt(),

  // Array de items:
  // [{ id_plan_item, criterios:[{id_rubrica_criterio, id_rubrica_criterio_nivel, observacion?}] }]
  body("items").isArray({ min: 1 }),
  body("items.*.id_plan_item").isInt({ min: 1 }).toInt(),
  body("items.*.criterios").isArray({ min: 1 }),
  body("items.*.criterios.*.id_rubrica_criterio").isInt({ min: 1 }).toInt(),
  body("items.*.criterios.*.id_rubrica_criterio_nivel").isInt({ min: 1 }).toInt(),
  body("items.*.criterios.*.observacion").optional().isString().isLength({ max: 400 }),
  validate,
  ctrl.guardarMisCalificaciones
);

module.exports = router;
