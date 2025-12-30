const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/rubrica.controller");

// LISTAR (opcional, admin)
router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("periodoId").optional().isInt({ min: 1 }).toInt(),
  validate,
  ctrl.list
);

// OBTENER RÚBRICA POR PERÍODO (si no existe => 404)
router.get(
  "/periodo/:idPeriodo",
  param("idPeriodo").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.getByPeriodo
);

// CREAR SI NO EXISTE (idempotente)
// Si ya existe => la devuelve
router.post(
  "/periodo/:idPeriodo",
  param("idPeriodo").isInt({ min: 1 }).toInt(),
  body("nombre_rubrica").optional().isString().trim(),
  body("descripcion_rubrica").optional().isString().trim(),
  body("ponderacion_global").optional().isDecimal(),
  validate,
  ctrl.ensureByPeriodo
);

// OBTENER POR ID
router.get(
  "/:id",
  param("id").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

// ACTUALIZAR INFO GENERAL
router.put(
  "/:id",
  param("id").isInt({ min: 1 }).toInt(),
  body("nombre_rubrica").isString().trim().notEmpty(),
  body("descripcion_rubrica").optional().isString().trim(),
  body("ponderacion_global").optional().isDecimal(),
  validate,
  ctrl.update
);

// CAMBIAR ESTADO
router.patch(
  "/:id/estado",
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
