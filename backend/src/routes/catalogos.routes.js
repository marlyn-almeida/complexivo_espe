const router = require("express").Router();
const { query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/catalogos.controller");

router.get("/componentes",
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.componentes
);

router.get("/criterios",
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.criterios
);

router.get("/niveles",
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.niveles
);

module.exports = router;
