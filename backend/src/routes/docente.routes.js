// src/routes/docente.routes.js
const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/docente.controller");
const { authorize } = require("../middlewares/auth.middleware");

// ✅ /me debe ir antes de /:id para no chocar
router.get("/me", authorize(["SUPER_ADMIN", "ADMIN", "DOCENTE"]), ctrl.me);

router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("q").optional().isString(),
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
  body("cedula").isString().trim().notEmpty(),
  body("nombres_docente").isString().trim().notEmpty(),
  body("apellidos_docente").isString().trim().notEmpty(),
  body("correo_docente").optional().isEmail(),
  body("telefono_docente").optional().isString(),
  body("nombre_usuario").isString().trim().notEmpty(),
  body("password").optional().isString(),

  // ✅ NUEVO: Asignación por carrera 
  // SUPER_ADMIN puede enviar id_carrera o codigo_carrera (opcional)
  body("id_carrera").optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  body("codigo_carrera").optional({ nullable: true }).isString().trim().notEmpty(),

  validate,
  ctrl.create
);

router.put(
  "/:id",
  param("id").isInt({ min: 1 }).toInt(),
  body("id_institucional_docente").isString().trim().notEmpty(),
  body("cedula").isString().trim().notEmpty(),
  body("nombres_docente").isString().trim().notEmpty(),
  body("apellidos_docente").isString().trim().notEmpty(),
  body("correo_docente").optional().isEmail(),
  body("telefono_docente").optional().isString(),
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

module.exports = router;
