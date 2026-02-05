const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/ponderacion.controller");

router.get(
  "/",
  authorize(["ADMIN"]),
  ctrl.get
);

router.post(
  "/",
  authorize(["ADMIN"]),
  body("peso_teorico_final_pct").isFloat({ min: 0, max: 100 }).toFloat(),
  body("peso_practico_final_pct").isFloat({ min: 0, max: 100 }).toFloat(),
  body("peso_practico_escrito_pct").isFloat({ min: 0, max: 100 }).toFloat(),
  body("peso_practico_oral_pct").isFloat({ min: 0, max: 100 }).toFloat(),
  validate,
  ctrl.upsert
);

module.exports = router;
