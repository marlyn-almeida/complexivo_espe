// src/routes/tribunal.routes.js
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/tribunal.controller");
const { auth, authorize } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");

// ✅ Mis tribunales (DOCENTE)
router.get(
  "/mis-tribunales",
  auth,
  authorize(["DOCENTE"]),
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.misTribunales
);

// ✅ Listado (ADMIN/SUPER_ADMIN)
// ADMIN usa ctx (x-carrera-periodo-id) sí o sí
router.get(
  "/",
  auth,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  attachCarreraPeriodoCtx,
  query("includeInactive").optional().isBoolean().toBoolean(),
  // SUPER_ADMIN puede filtrar por carreraPeriodoId si quiere
  query("carreraPeriodoId").optional().isInt({ min: 1 }).toInt(),
  validate,
  ctrl.list
);

router.get(
  "/:id",
  auth,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  attachCarreraPeriodoCtx,
  param("id").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

router.post(
  "/",
  auth,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  attachCarreraPeriodoCtx,
  body("id_carrera_periodo").isInt({ min: 1 }).toInt(),
  body("nombre_tribunal").isString().trim().notEmpty(),
  body("descripcion_tribunal").optional().isString().trim(),
  body("docentes.presidente").isInt({ min: 1 }).toInt(),
  body("docentes.integrante1").isInt({ min: 1 }).toInt(),
  body("docentes.integrante2").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.create
);

router.put(
  "/:id",
  auth,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  attachCarreraPeriodoCtx,
  param("id").isInt({ min: 1 }).toInt(),
  body("id_carrera_periodo").isInt({ min: 1 }).toInt(),
  body("nombre_tribunal").isString().trim().notEmpty(),
  body("descripcion_tribunal").optional().isString().trim(),
  body("docentes").optional().isObject(),
  body("docentes.presidente").optional().isInt({ min: 1 }).toInt(),
  body("docentes.integrante1").optional().isInt({ min: 1 }).toInt(),
  body("docentes.integrante2").optional().isInt({ min: 1 }).toInt(),
  validate,
  ctrl.update
);

router.patch(
  "/:id/estado",
  auth,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  attachCarreraPeriodoCtx,
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
