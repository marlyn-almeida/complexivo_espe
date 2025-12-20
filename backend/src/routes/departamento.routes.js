const router = require("express").Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const ctrl = require("../controllers/departamento.controller");

// GET /api/departamentos
router.get("/", ctrl.list);

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
  body("descripcion_departamento").optional().isString().isLength({ max: 200 }),
  validate,
  ctrl.create
);

// PUT /api/departamentos/:id
router.put(
  "/:id",
  param("id").isInt({ min: 1 }),
  body("nombre_departamento").isString().trim().notEmpty().isLength({ max: 100 }),
  body("descripcion_departamento").optional().isString().isLength({ max: 200 }),
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
