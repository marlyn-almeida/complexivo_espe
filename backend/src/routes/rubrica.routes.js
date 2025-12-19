const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/rubrica.controller");

router.get("/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("carreraPeriodoId").optional().isInt({min:1}).toInt(),
  validate, ctrl.list
);

router.get("/:id",
  param("id").isInt({min:1}).toInt(),
  validate, ctrl.get
);

router.post("/",
  body("id_carrera_periodo").isInt({min:1}).toInt(),
  body("nombre_rubrica").isString().trim().notEmpty(),
  body("descripcion_rubrica").optional().isString(),
  validate, ctrl.create
);

router.put("/:id",
  param("id").isInt({min:1}).toInt(),
  body("id_carrera_periodo").isInt({min:1}).toInt(),
  body("nombre_rubrica").isString().trim().notEmpty(),
  body("descripcion_rubrica").optional().isString(),
  validate, ctrl.update
);

router.patch("/:id/estado",
  param("id").isInt({min:1}).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate, ctrl.changeEstado
);

module.exports = router;
