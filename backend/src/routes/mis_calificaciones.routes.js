// src/routes/mis_calificaciones.routes.js
const router = require("express").Router();
const { param, body } = require("express-validator");

const validate = require("../middlewares/validate.middleware");
const { authorize, auth } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");

const ctrl = require("../controllers/mis_calificaciones.controller");

/**
 * ✅ ADMIN (ROL 2) - listado por CP (tu listByCP)
 * GET /mis-calificaciones
 */
router.get(
  "/",
  auth,
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  validate,
  ctrl.list
);

/**
 * ✅ DOCENTE (ROL 3) - cargar estructura para calificar 1 tribunal_estudiante
 * GET /mis-calificaciones/:idTribunalEstudiante
 */
router.get(
  "/:idTribunalEstudiante",
  auth,
  authorize(["DOCENTE"]),
  attachCarreraPeriodoCtx,
  param("idTribunalEstudiante").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.getForDocente
);

/**
 * ✅ DOCENTE (ROL 3) - guardar calificación (criterios permitidos)
 * POST /mis-calificaciones/:idTribunalEstudiante
 */
router.post(
  "/:idTribunalEstudiante",
  auth,
  authorize(["DOCENTE"]),
  attachCarreraPeriodoCtx,
  param("idTribunalEstudiante").isInt({ min: 1 }).toInt(),

  body("calificaciones").isArray({ min: 0 }),
  body("calificaciones.*.id_criterio").isInt({ min: 1 }).toInt(),
  body("calificaciones.*.id_nivel").isInt({ min: 1 }).toInt(),
  body("calificaciones.*.observacion").optional({ nullable: true }).isString(),

  body("observacion_general").optional({ nullable: true }).isString(),

  validate,
  ctrl.saveForDocente
);

module.exports = router;
