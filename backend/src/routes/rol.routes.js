const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/rol.controller");

// 🔐 Cuando tengas login JWT, habilita:
const { auth, authorize } = require("../middlewares/auth.middleware");

router.get(
  "/",
  auth,
  authorize(["SUPER_ADMIN"]),
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("q").optional().isString(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  ctrl.list
);

router.get(
  "/:id",
  auth,
  authorize(["SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

router.post(
  "/",
  auth,
  authorize(["SUPER_ADMIN"]),
  body("nombre_rol").isString().trim().notEmpty(),
  body("descripcion_rol").optional().isString().trim(),
  validate,
  ctrl.create
);

router.put(
  "/:id",
  auth,
  authorize(["SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  body("nombre_rol").isString().trim().notEmpty(),
  body("descripcion_rol").optional().isString().trim(),
  validate,
  ctrl.update
);

router.patch(
  "/:id/estado",
  auth,
  authorize(["SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  body("estado").isBoolean().toBoolean(),
  validate,
  ctrl.changeEstado
);

module.exports = router;
