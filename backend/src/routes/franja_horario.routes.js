const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/franja_horario.controller");

router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("carreraPeriodoId").optional().isInt({ min: 1 }).toInt(),
  query("fecha").optional().isISO8601(),
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
  body("fecha").isISO8601(),
  body("hora_inicio").matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body("hora_fin").matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body("laboratorio").isString().trim().notEmpty(),
  validate,
  ctrl.create
);

router.put(
  "/:id",
  param("id").isInt({ min: 1 }).toInt(),
  body("id_carrera_periodo").isInt({ min: 1 }).toInt(),
  body("fecha").isISO8601(),
  body("hora_inicio").matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body("hora_fin").matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body("laboratorio").isString().trim().notEmpty(),
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
