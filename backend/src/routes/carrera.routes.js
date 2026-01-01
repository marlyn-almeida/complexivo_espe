const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const repo = require("../repositories/carrera.repo");

// ✅ NUEVO: controller para Director/Apoyo
const carreraAdminController = require("../controllers/carrera_admin.controller");

// Helpers normalización
function normalizeModalidad(value) {
  if (value === undefined || value === null) return value;
  const v = String(value).trim().toUpperCase();

  // Soporta UI "EN LÍNEA" / "EN LINEA"
  if (v === "EN LÍNEA" || v === "EN LINEA") return "EN LINEA";

  // Soporta mayúsculas
  if (v === "PRESENCIAL") return "PRESENCIAL";

  // Soporta backend anterior
  if (v === "EN LÍNEA") return "EN LINEA";

  return v;
}

function normalizeSede(value) {
  if (value === undefined || value === null) return value;
  return String(value).trim();
}

// =======================
// ADMIN (DIRECTOR / APOYO) POR CARRERA
// =======================

// GET /api/carreras/:id/admin
router.get(
  "/:id/admin",
  param("id").isInt().withMessage("ID inválido"),
  validate,
  (req, res, next) => carreraAdminController.getAdmins(req, res, next)
);

// PUT /api/carreras/:id/admin
router.put(
  "/:id/admin",
  param("id").isInt().withMessage("ID inválido"),

  // puede venir null para "quitar"
  body("id_docente_director")
    .optional({ nullable: true })
    .custom((v) => v === null || v === "" || Number.isInteger(Number(v)))
    .withMessage("id_docente_director debe ser int o null"),

  body("id_docente_apoyo")
    .optional({ nullable: true })
    .custom((v) => v === null || v === "" || Number.isInteger(Number(v)))
    .withMessage("id_docente_apoyo debe ser int o null"),

  validate,
  (req, res, next) => carreraAdminController.setAdmins(req, res, next)
);

// LISTAR
router.get(
  "/",
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  validate,
  async (req, res) => {
    const data = await repo.findAll(req.query);
    res.json(data);
  }
);

// CREAR
router.post(
  "/",
  body("nombre_carrera")
    .isString().withMessage("Nombre inválido")
    .notEmpty().withMessage("Nombre obligatorio")
    .isLength({ max: 120 }).withMessage("Máximo 120 caracteres"),

  body("codigo_carrera")
    .isString().withMessage("Código inválido")
    .notEmpty().withMessage("Código obligatorio")
    .isLength({ max: 30 }).withMessage("Máximo 30 caracteres"),

  body("id_departamento")
    .isInt().withMessage("Departamento inválido"),

  // ✅ AQUÍ EL FIX
  body("modalidad")
    .optional()
    .customSanitizer(normalizeModalidad)
    .isIn(["EN LINEA", "PRESENCIAL"])
    .withMessage("Modalidad inválida (use EN LÍNEA o PRESENCIAL)"),

  body("sede")
    .optional()
    .customSanitizer(normalizeSede)
    .isString().withMessage("Sede inválida")
    .isLength({ max: 80 }).withMessage("Máximo 80 caracteres"),

  body("descripcion_carrera")
    .optional()
    .isString().withMessage("Descripción inválida")
    .isLength({ max: 200 }).withMessage("Máximo 200 caracteres"),

  validate,
  async (req, res) => {
    const { nombre_carrera, codigo_carrera, id_departamento } = req.body;

    if (await repo.findByNombre(nombre_carrera)) {
      return res.status(400).json({ message: "La carrera ya existe" });
    }

    if (await repo.findByCodigo(codigo_carrera)) {
      return res.status(400).json({ message: "El código ya existe" });
    }

    if (!(await repo.departamentoExists(id_departamento))) {
      return res.status(400).json({ message: "Departamento inválido" });
    }

    const carrera = await repo.create(req.body);
    res.status(201).json(carrera);
  }
);

// EDITAR
router.put(
  "/:id",
  param("id").isInt().withMessage("ID inválido"),

  body("nombre_carrera")
    .isString().notEmpty().isLength({ max: 120 }),

  body("codigo_carrera")
    .isString().notEmpty().isLength({ max: 30 }),

  body("id_departamento")
    .isInt(),

  // ✅ agrega validación también aquí
  body("modalidad")
    .optional()
    .customSanitizer(normalizeModalidad)
    .isIn(["EN LINEA", "PRESENCIAL"])
    .withMessage("Modalidad inválida"),

  body("sede")
    .optional()
    .customSanitizer(normalizeSede)
    .isString()
    .isLength({ max: 80 }),

  body("descripcion_carrera")
    .optional()
    .isString()
    .isLength({ max: 200 }),

  validate,
  async (req, res) => {
    const carrera = await repo.update(req.params.id, req.body);
    res.json(carrera);
  }
);

// CAMBIAR ESTADO
router.patch(
  "/:id/estado",
  param("id").isInt(),
  body("estado").isIn([0, 1]),
  validate,
  async (req, res) => {
    const carrera = await repo.setEstado(req.params.id, req.body.estado);
    res.json(carrera);
  }
);

module.exports = router;
