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
 * Requiere x-carrera-periodo-id (o equivalente) para attachCarreraPeriodoCtx
 * (y tu middleware también soporta query por compatibilidad)
 */
router.get("/", auth, authorize(["ADMIN"]), attachCarreraPeriodoCtx, validate, ctrl.list);

/**
 * ✅ DOCENTE (ROL 3)
 * GET /mis-calificaciones/:idTribunalEstudiante
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
 * ✅ DOCENTE (ROL 3)
 * POST /mis-calificaciones/:idTribunalEstudiante
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
