const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/rubrica.controller");

// listar (por periodoId opcional)
router.get("/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("periodoId").optional().isInt({ min: 1 }).toInt(),
  query("tipo_rubrica").optional().isIn(["ESCRITA", "ORAL"]),
  validate,
  ctrl.list
);

router.get("/:id",
  param("id").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

router.post("/",
  body("id_periodo").isInt({ min: 1 }).toInt(),
  body("tipo_rubrica").isIn(["ESCRITA", "ORAL"]),
  body("ponderacion_global").optional().isDecimal(),
  body("nombre_rubrica").isString().trim().notEmpty(),
  body("descripcion_rubrica").optional().isString(),
  validate,
  ctrl.create
);

// ✅ crea si no existe y devuelve (clave para botones ORAL/ESCRITA en /rubricas)
router.post("/ensure",
  body("id_periodo").isInt({ min: 1 }).toInt(),
  body("tipo_rubrica").isIn(["ESCRITA", "ORAL"]),
  body("nombre_base").optional().isString().trim(),
  validate,
  ctrl.ensure
);

router.put("/:id",
  param("id").isInt({ min: 1 }).toInt(),
  body("id_periodo").isInt({ min: 1 }).toInt(),
  body("tipo_rubrica").isIn(["ESCRITA", "ORAL"]),
  body("ponderacion_global").optional().isDecimal(),
  body("nombre_rubrica").isString().trim().notEmpty(),
  body("descripcion_rubrica").optional().isString(),
  validate,
  ctrl.update
);

router.patch("/:id/estado",
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
