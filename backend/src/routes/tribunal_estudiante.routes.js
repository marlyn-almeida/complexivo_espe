// src/routes/tribunal_estudiante.routes.js
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/tribunal_estudiante.controller");
const { auth, authorize } = require("../middlewares/auth.middleware");

// ✅ ROL 3: Mis asignaciones (agenda)
router.get(
  "/mis-asignaciones",
  auth,
  authorize([3]),
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.misAsignaciones
);

// ✅ LISTAR
router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("tribunalId").optional().isInt({ min: 1 }).toInt(),
  validate,
  ctrl.list
);

// ✅ CREAR asignación (ahora incluye caso_estudio)
router.post(
  "/",
  body("id_tribunal").isInt({ min: 1 }).toInt(),
  body("id_estudiante").isInt({ min: 1 }).toInt(),
  body("id_franja_horario").isInt({ min: 1 }).toInt(),
  body("id_caso_estudio").isInt({ min: 1 }).toInt(), // ✅ NUEVO
  validate,
  ctrl.create
);

// ✅ Activar/Desactivar
router.patch(
  "/:id/estado",
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
