const router = require("express").Router({ mergeParams: true });
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/rubrica_criterio_nivel.controller");

// listar celdas de un criterio
router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.list
);

// upsert: crea o actualiza celda (criterio + nivel)
router.post(
  "/",
  body("id_rubrica_nivel").isInt({ min: 1 }).toInt(),
  // ✅ permitir vacío (editor tipo Excel)
  body("descripcion").optional().isString().trim(),
  validate,
  ctrl.upsert
);

router.patch(
  "/:id/estado",
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
