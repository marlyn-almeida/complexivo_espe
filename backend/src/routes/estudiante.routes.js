const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/estudiante.controller");

// GET /api/estudiantes?includeInactive=true|false|1|0&q=...&carreraPeriodoId=...&page=1&limit=50
router.get(
  "/",
  query("includeInactive")
    .optional()
    .isIn(["true", "false", "1", "0"])
    .withMessage("includeInactive debe ser true/false/1/0")
    .toBoolean(),
  query("q").optional().isString(),
  query("carreraPeriodoId").optional().isInt({ min: 1 }).toInt(),
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
  body("id_carrera_periodo").isInt({ min: 1 }).toInt(),
  body("id_institucional_estudiante").isString().trim().notEmpty(),
  body("cedula")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("La cédula es obligatoria")
    .matches(/^\d{10,}$/)
    .withMessage("La cédula debe tener solo dígitos (mínimo 10)"),
  body("nombres_estudiante").isString().trim().notEmpty(),
  body("apellidos_estudiante").isString().trim().notEmpty(),
  body("correo_estudiante").optional({ nullable: true }).isEmail(),
  body("telefono_estudiante").optional({ nullable: true }).isString(),
  validate,
  ctrl.create
);

router.put(
  "/:id",
  param("id").isInt({ min: 1 }).toInt(),
  body("id_carrera_periodo").isInt({ min: 1 }).toInt(),
  body("id_institucional_estudiante").isString().trim().notEmpty(),
  body("cedula")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("La cédula es obligatoria")
    .matches(/^\d{10,}$/)
    .withMessage("La cédula debe tener solo dígitos (mínimo 10)"),
  body("nombres_estudiante").isString().trim().notEmpty(),
  body("apellidos_estudiante").isString().trim().notEmpty(),
  body("correo_estudiante").optional({ nullable: true }).isEmail(),
  body("telefono_estudiante").optional({ nullable: true }).isString(),
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
