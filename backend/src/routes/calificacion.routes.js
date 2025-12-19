const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/calificacion.controller");

router.get("/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("tribunalEstudianteId").optional().isInt({min:1}).toInt(),
  query("rubricaId").optional().isInt({min:1}).toInt(),
  validate, ctrl.list
);

router.get("/:id",
  param("id").isInt({min:1}).toInt(),
  validate, ctrl.get
);

router.post("/",
  body("id_tribunal_estudiante").isInt({min:1}).toInt(),
  body("id_rubrica").isInt({min:1}).toInt(),
  body("tipo_rubrica").isString().trim().notEmpty(),
  body("nota_base20").isDecimal(),
  body("observacion").optional().isString(),
  validate, ctrl.create
);

router.put("/:id",
  param("id").isInt({min:1}).toInt(),
  body("tipo_rubrica").isString().trim().notEmpty(),
  body("nota_base20").isDecimal(),
  body("observacion").optional().isString(),
  validate, ctrl.update
);

router.patch("/:id/estado",
  param("id").isInt({min:1}).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate, ctrl.changeEstado
);

module.exports = router;
