const router = require("express").Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/nota_teorico.controller");

router.get(
  "/:id_estudiante",
  authorize(["ADMIN"]),
  param("id_estudiante").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

router.post(
  "/",
  authorize(["ADMIN"]),
  body("id_estudiante").isInt({ min: 1 }).toInt(),
  body("nota_teorico_20").isFloat({ min: 0, max: 20 }).toFloat(),
  body("observacion").optional().isString().isLength({ max: 400 }),
  validate,
  ctrl.upsert
);

module.exports = router;
