// ✅ src/routes/tribunal_estudiante.routes.js
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

// ✅ LISTAR (ROL 1,2)
router.get(
  "/",
  auth,
  authorize([1, 2]),
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("tribunalId").optional().isInt({ min: 1 }).toInt(),
  validate,
  ctrl.list
);

// ✅ CREAR asignación (ROL 1,2)
// AHORA REQUIERE id_caso_estudio (se asigna al crear tribunal_estudiante)
router.post(
  "/",
  auth,
  authorize([1, 2]),
  body("id_tribunal").isInt({ min: 1 }).toInt(),
  body("id_estudiante").isInt({ min: 1 }).toInt(),
  body("id_franja_horario").isInt({ min: 1 }).toInt(),
  body("id_caso_estudio").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.create
);

// ✅ Activar/Desactivar
router.patch(
  "/:id/estado",
  auth,
  authorize([1, 2]),
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

// ✅ Cerrar / Abrir (bloquea calificaciones)
router.patch(
  "/:id/cierre",
  auth,
  authorize([1, 2]),
  param("id").isInt({ min: 1 }).toInt(),
  body("cerrado").isBoolean().toBoolean(),
  validate,
  ctrl.changeCierre
);

module.exports = router;
