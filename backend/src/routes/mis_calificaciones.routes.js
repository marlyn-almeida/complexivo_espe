// ✅ src/routes/mis_calificaciones.routes.js
const router = require("express").Router();
const { param, body } = require("express-validator");

const validate = require("../middlewares/validate.middleware");
const { auth, authorize } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");

const ctrl = require("../controllers/mis_calificaciones.controller");

/**
 * ✅ ADMIN (ROL 2) - listado por CP
 * GET /mis-calificaciones
 *
 * Soporta:
 * - Header x-carrera-periodo-id (attachCarreraPeriodoCtx)
 * - Query ?id_carrera_periodo=2 (por compatibilidad con tu front actual)
 */
router.get(
  "/",
  auth,
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx, // ✅ si viene header lo llena en req.ctx
  validate,
  ctrl.list
);

/**
 * ✅ DOCENTE (ROL 3) - cargar estructura para calificar
 * GET /mis-calificaciones/:idTribunalEstudiante
 *
 * OJO: NO exigimos CP (porque ctx solo aplica a ADMIN)
 */
router.get(
  "/:idTribunalEstudiante",
  auth,
  authorize(["DOCENTE"]),
  param("idTribunalEstudiante").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.getForDocente
);

/**
 * ✅ DOCENTE (ROL 3) - guardar calificación
 * POST /mis-calificaciones/:idTribunalEstudiante
 *
 * (STUB por ahora)
 */
router.post(
  "/:idTribunalEstudiante",
  auth,
  authorize(["DOCENTE"]),
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
