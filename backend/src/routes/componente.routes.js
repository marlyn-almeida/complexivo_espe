const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/componente.controller");

router.get("/", query("includeInactive").optional().isBoolean().toBoolean(), validate, ctrl.list);
router.get("/:id", param("id").isInt({min:1}).toInt(), validate, ctrl.get);

router.post("/", body("nombre_componente").isString().trim().notEmpty(), validate, ctrl.create);
router.put("/:id",
  param("id").isInt({min:1}).toInt(),
  body("nombre_componente").isString().trim().notEmpty(),
  validate, ctrl.update
);
router.patch("/:id/estado",
  param("id").isInt({min:1}).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate, ctrl.changeEstado
);

module.exports = router;
