const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/rubrica_componente.controller");

router.get("/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("rubricaId").optional().isInt({min:1}).toInt(),
  validate, ctrl.list
);

router.get("/:id", param("id").isInt({min:1}).toInt(), validate, ctrl.get);

router.post("/",
  body("id_rubrica").isInt({min:1}).toInt(),
  body("id_componente").isInt({min:1}).toInt(),
  body("ponderacion_porcentaje").isDecimal(),
  body("orden_componente").isInt({min:1}).toInt(),
  validate, ctrl.create
);

router.put("/:id",
  param("id").isInt({min:1}).toInt(),
  body("ponderacion_porcentaje").isDecimal(),
  body("orden_componente").isInt({min:1}).toInt(),
  validate, ctrl.update
);

router.patch("/:id/estado",
  param("id").isInt({min:1}).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate, ctrl.changeEstado
);

module.exports = router;
