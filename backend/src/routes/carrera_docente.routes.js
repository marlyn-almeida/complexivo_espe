const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/carrera_docente.controller");

router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("docenteId").optional().isInt({min:1}).toInt(),
  query("carreraPeriodoId").optional().isInt({min:1}).toInt(),
  validate,
  ctrl.list
);

router.post(
  "/",
  body("id_docente").isInt({min:1}).toInt(),
  body("id_carrera_periodo").isInt({min:1}).toInt(),
  validate,
  ctrl.create
);

router.patch(
  "/:id/estado",
  param("id").isInt({min:1}).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
