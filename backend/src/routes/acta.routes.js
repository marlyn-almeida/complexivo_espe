const router = require("express").Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/acta.controller");

router.post("/generar",
  body("id_tribunal_estudiante").isInt({min:1}).toInt(),
  body("id_rubrica").isInt({min:1}).toInt(),
  body("fecha_acta").optional().isISO8601(),
  body("umbral_aprobacion").optional().isInt({min:0,max:20}).toInt(),
  validate,
  ctrl.generar
);

router.get("/:id",
  param("id").isInt({min:1}).toInt(),
  validate,
  ctrl.get
);

router.patch("/:id/estado",
  param("id").isInt({min:1}).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
