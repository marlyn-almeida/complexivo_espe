const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/franja_horario.controller");

// ✅ Regex estricto para DATE: YYYY-MM-DD
const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;
// ✅ Regex para TIME: HH:MM o HH:MM:SS
const TIME_HH_MM_SS = /^\d{2}:\d{2}(:\d{2})?$/;

router.get(
  "/",
  query("includeInactive")
    .optional()
    .isBoolean().withMessage("includeInactive debe ser boolean (true/false)")
    .toBoolean(),

  query("carreraPeriodoId")
    .optional()
    .isInt({ min: 1 }).withMessage("carreraPeriodoId debe ser entero >= 1")
    .toInt(),

  // ✅ mejora: fecha estricta DATE (no datetime)
  query("fecha")
    .optional()
    .matches(DATE_YYYY_MM_DD).withMessage("fecha debe tener formato YYYY-MM-DD"),

  validate,
  ctrl.list
);

router.get(
  "/:id",
  param("id")
    .isInt({ min: 1 }).withMessage("id debe ser entero >= 1")
    .toInt(),
  validate,
  ctrl.get
);

router.post(
  "/",
  body("id_carrera_periodo")
    .isInt({ min: 1 }).withMessage("id_carrera_periodo debe ser entero >= 1")
    .toInt(),

  // ✅ mejora: fecha estricta DATE (no datetime)
  body("fecha")
    .matches(DATE_YYYY_MM_DD).withMessage("fecha debe tener formato YYYY-MM-DD"),

  body("hora_inicio")
    .matches(TIME_HH_MM_SS).withMessage("hora_inicio debe ser HH:MM o HH:MM:SS"),

  body("hora_fin")
    .matches(TIME_HH_MM_SS).withMessage("hora_fin debe ser HH:MM o HH:MM:SS"),

  body("laboratorio")
    .isString().withMessage("laboratorio debe ser string")
    .trim()
    .notEmpty().withMessage("laboratorio es requerido"),

  validate,
  ctrl.create
);

router.put(
  "/:id",
  param("id")
    .isInt({ min: 1 }).withMessage("id debe ser entero >= 1")
    .toInt(),

  body("id_carrera_periodo")
    .isInt({ min: 1 }).withMessage("id_carrera_periodo debe ser entero >= 1")
    .toInt(),

  // ✅ mejora: fecha estricta DATE (no datetime)
  body("fecha")
    .matches(DATE_YYYY_MM_DD).withMessage("fecha debe tener formato YYYY-MM-DD"),

  body("hora_inicio")
    .matches(TIME_HH_MM_SS).withMessage("hora_inicio debe ser HH:MM o HH:MM:SS"),

  body("hora_fin")
    .matches(TIME_HH_MM_SS).withMessage("hora_fin debe ser HH:MM o HH:MM:SS"),

  body("laboratorio")
    .isString().withMessage("laboratorio debe ser string")
    .trim()
    .notEmpty().withMessage("laboratorio es requerido"),

  validate,
  ctrl.update
);

router.patch(
  "/:id/estado",
  param("id")
    .isInt({ min: 1 }).withMessage("id debe ser entero >= 1")
    .toInt(),

  body("estado")
    .isBoolean().withMessage("estado debe ser boolean (true/false)")
    .toBoolean(),

  validate,
  ctrl.changeEstado
);

module.exports = router;
