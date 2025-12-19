const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/periodo_academico.controller");

router.get("/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("q").optional().isString().trim(),
  validate, ctrl.list
);

router.get("/:id",
  param("id").isInt({min:1}).toInt(),
  validate, ctrl.get
);

router.post("/",
  body("codigo_periodo").isString().trim().notEmpty(),
  body("descripcion_periodo").optional().isString(),
  body("fecha_inicio").isISO8601(),
  body("fecha_fin").isISO8601(),
  validate, ctrl.create
);

router.put("/:id",
  param("id").isInt({min:1}).toInt(),
  body("codigo_periodo").isString().trim().notEmpty(),
  body("descripcion_periodo").optional().isString(),
  body("fecha_inicio").isISO8601(),
  body("fecha_fin").isISO8601(),
  validate, ctrl.update
);

router.patch("/:id/estado",
  param("id").isInt({min:1}).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate, ctrl.changeEstado
);

module.exports = router;
