const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/departamento.controller");

// GET /api/departamentos?includeInactive=false&q=...
router.get(
  "/",
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("q").optional().isString().trim().isLength({ max: 80 }),
  validate,
  ctrl.list
);

// GET /api/departamentos/:id
router.get(
  "/:id",
  param("id").isInt({ min: 1 }),
  validate,
  ctrl.getById
);

// POST /api/departamentos
router.post(
  "/",
  body("nombre_departamento").isString().trim().notEmpty().isLength({ max: 100 }),
  body("descripcion_departamento").optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
  validate,
  ctrl.create
);

// PUT /api/departamentos/:id
router.put(
  "/:id",
  param("id").isInt({ min: 1 }),
  body("nombre_departamento").isString().trim().notEmpty().isLength({ max: 100 }),
  body("descripcion_departamento").optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
  validate,
  ctrl.update
);

// PATCH /api/departamentos/:id/estado
router.patch(
  "/:id/estado",
  param("id").isInt({ min: 1 }),
  body("estado").isInt().custom((v) => v === 0 || v === 1),
  validate,
  ctrl.setEstado
);

module.exports = router;
