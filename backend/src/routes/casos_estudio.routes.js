const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/casos_estudio.controller");

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
  body("numero_caso").isInt({ min: 1 }).toInt(),
  body("titulo").optional().isString().isLength({ max: 150 }),
  body("descripcion").optional().isString().isLength({ max: 500 }),
  body("archivo_nombre").isString().isLength({ min: 1, max: 255 }),
  body("archivo_path").isString().isLength({ min: 1, max: 500 }),
  validate,
  ctrl.create
);

router.put(
  "/:id_caso_estudio",
  authorize(["ADMIN"]),
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  body("numero_caso").optional().isInt({ min: 1 }).toInt(),
  body("titulo").optional().isString().isLength({ max: 150 }),
  body("descripcion").optional().isString().isLength({ max: 500 }),
  body("archivo_nombre").optional().isString().isLength({ max: 255 }),
  body("archivo_path").optional().isString().isLength({ max: 500 }),
  body("estado").optional().isBoolean().toBoolean(),
  validate,
  ctrl.update
);

module.exports = router;
