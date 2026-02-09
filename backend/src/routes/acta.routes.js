// src/routes/acta.routes.js
const router = require("express").Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/acta.controller");
const { auth, authorize } = require("../middlewares/auth.middleware");

// Generar acta desde tribunal_estudiante (ADMIN / SUPER_ADMIN)
router.post(
  "/generar",
  auth,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  body("id_tribunal_estudiante").isInt({ min: 1 }).toInt(),
  body("id_rubrica").isInt({ min: 1 }).toInt(),
  body("fecha_acta").optional().isISO8601(),
  body("umbral_aprobacion").optional().isInt({ min: 0, max: 20 }).toInt(),
  validate,
  ctrl.generar
);

router.get(
  "/:id",
  auth,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

router.patch(
  "/:id/estado",
  auth,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
