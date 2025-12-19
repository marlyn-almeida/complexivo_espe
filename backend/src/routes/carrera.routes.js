const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/carrera.controller");

// 🔐 cuando metas auth: auth + authorize(["SUPER_ADMIN","ADMIN"])

router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("q").optional().isString(),
  query("departamentoId").optional().isInt({ min: 1 }).toInt(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  ctrl.list
);

router.get(
  "/:id",
  param("id").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

router.post(
  "/",
  body("nombre_carrera").isString().trim().notEmpty(),
  body("codigo_carrera").isString().trim().notEmpty(),
  body("descripcion_carrera").optional().isString().trim(),
  body("id_departamento").isInt({ min: 1 }).toInt(),
  body("sede").optional().isString().trim(),
  body("modalidad").optional().isString().trim(),
  validate,
  ctrl.create
);

router.put(
  "/:id",
  param("id").isInt({ min: 1 }).toInt(),
  body("nombre_carrera").isString().trim().notEmpty(),
  body("codigo_carrera").isString().trim().notEmpty(),
  body("descripcion_carrera").optional().isString().trim(),
  body("id_departamento").isInt({ min: 1 }).toInt(),
  body("sede").optional().isString().trim(),
  body("modalidad").optional().isString().trim(),
  validate,
  ctrl.update
);

router.patch(
  "/:id/estado",
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
