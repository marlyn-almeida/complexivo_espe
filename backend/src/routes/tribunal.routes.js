// src/routes/tribunal.routes.js
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/tribunal.controller");
const { auth, authorize } = require("../middlewares/auth.middleware");

// ✅ NUEVO: Mis tribunales (ROL 3)
router.get(
  "/mis-tribunales",
  auth,
  authorize([3]),
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.misTribunales
);

router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("carreraPeriodoId").optional().isInt({ min: 1 }).toInt(),
  validate,
  ctrl.list
);

router.get(
  "/:id",
  param("id").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

router.post(
  "/",
  body("id_carrera_periodo").isInt({ min: 1 }).toInt(),
  body("caso").optional({ values: "falsy" }).isInt({ min: 1 }).toInt(),
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
  param("id").isInt({ min: 1 }).toInt(),
  body("id_carrera_periodo").isInt({ min: 1 }).toInt(),
  body("caso").optional({ values: "falsy" }).isInt({ min: 1 }).toInt(),
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
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
