const router = require("express").Router({ mergeParams: true });
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/rubrica_criterio.controller");

router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.list
);

router.post(
  "/",
  body("nombre_criterio").isString().trim().notEmpty(),
  body("orden").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.create
);

router.put(
  "/:id",
  param("id").isInt({ min: 1 }).toInt(),
  body("nombre_criterio").isString().trim().notEmpty(),
  body("orden").isInt({ min: 1 }).toInt(),
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
