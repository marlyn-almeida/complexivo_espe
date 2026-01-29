// src/routes/docente.routes.js
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/docente.controller");
const { authorize } = require("../middlewares/auth.middleware");

// /me antes de /:id
router.get("/me", authorize(["SUPER_ADMIN", "ADMIN", "DOCENTE"]), ctrl.me);

router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("q").optional().isString(),

  query("id_carrera").optional().isInt({ min: 1 }).toInt(),
  query("id_departamento").optional().isInt({ min: 1 }).toInt(),

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
  body("id_institucional_docente").isString().trim().notEmpty(),
  body("id_departamento").isInt({ min: 1 }).toInt(),

  body("cedula").isString().trim().notEmpty(),
  body("nombres_docente").isString().trim().notEmpty(),
  body("apellidos_docente").isString().trim().notEmpty(),

  // ✅ correo obligatorio y valida formato
  body("correo_docente")
    .isString()
    .trim()
    .notEmpty()
    .isEmail()
    .custom((v) => String(v).toLowerCase().endsWith(".com"))
    .withMessage("El correo del docente debe terminar en .com"),

  // ✅ teléfono opcional
  body("telefono_docente").optional({ nullable: true }).isString(),

  body("nombre_usuario").isString().trim().notEmpty(),

  // ✅ asignación por carrera opcional (Formato B)
  body("id_carrera").optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  body("codigo_carrera").optional({ nullable: true }).isString().trim().notEmpty(),

  validate,
  ctrl.create
);

router.put(
  "/:id",
  param("id").isInt({ min: 1 }).toInt(),
  body("id_institucional_docente").isString().trim().notEmpty(),
  body("id_departamento").isInt({ min: 1 }).toInt(),
  body("cedula").isString().trim().notEmpty(),
  body("nombres_docente").isString().trim().notEmpty(),
  body("apellidos_docente").isString().trim().notEmpty(),

  body("correo_docente")
    .isString()
    .trim()
    .notEmpty()
    .isEmail()
    .custom((v) => String(v).toLowerCase().endsWith(".com"))
    .withMessage("El correo del docente debe terminar en .com"),

  body("telefono_docente").optional({ nullable: true }).isString(),
  body("nombre_usuario").isString().trim().notEmpty(),
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

router.patch(
  "/:id/super-admin",
  authorize(["SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  body("enabled").isBoolean().toBoolean(),
  validate,
  ctrl.setSuperAdmin
);

module.exports = router;
