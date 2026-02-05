const router = require("express").Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/entregas_caso.controller");

router.get(
  "/:id_estudiante/:id_caso_estudio",
  authorize(["ADMIN", "DOCENTE"]), // si el docente debe ver el PDF
  param("id_estudiante").isInt({ min: 1 }).toInt(),
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

router.post(
  "/",
  authorize(["ADMIN"]),
  body("id_estudiante").isInt({ min: 1 }).toInt(),
  body("id_caso_estudio").isInt({ min: 1 }).toInt(),
  body("archivo_nombre").isString().isLength({ min: 1, max: 255 }),
  body("archivo_path").isString().isLength({ min: 1, max: 500 }),
  body("observacion").optional().isString().isLength({ max: 400 }),
  validate,
  ctrl.upsert
);

module.exports = router;
