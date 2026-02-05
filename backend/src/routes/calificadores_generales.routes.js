const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/calificadores_generales.controller");

router.get(
  "/",
  authorize(["ADMIN"]),
  query("includeInactive").optional().isBoolean().toBoolean(),
  validate,
  ctrl.list
);

router.post(
  "/",
  authorize(["ADMIN"]),
  body("id_carrera_docente").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.add
);

router.delete(
  "/:id_cp_calificador_general",
  authorize(["ADMIN"]),
  param("id_cp_calificador_general").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.remove
);

module.exports = router;
