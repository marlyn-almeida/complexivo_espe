const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/casos_estudio.controller");

// ✅ multer (para multipart/form-data)
const multer = require("multer");

// Puedes cambiar a diskStorage si ya lo tienes implementado.
// Por ahora: memoria (tu controller/service debe guardar a disco o cloud)
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ===============================
// LIST
// GET /api/casos-estudio?includeInactive=false&carreraPeriodoId=123
// ===============================
router.get(
  "/",
  authorize(["ADMIN"]),
  query("includeInactive").optional().isBoolean().toBoolean(),
  query("carreraPeriodoId").optional().isInt({ min: 1 }).toInt(),
  validate,
  ctrl.list
);

// ===============================
// CREATE
// POST /api/casos-estudio (multipart/form-data)
// fields: id_carrera_periodo, numero_caso, titulo?, descripcion?, archivo(PDF)
// ===============================
// ✅ MUY IMPORTANTE: upload.single("archivo") ANTES de validar body
router.post(
  "/",
  authorize(["ADMIN"]),
  upload.single("archivo"),

  body("id_carrera_periodo").isInt({ min: 1 }).toInt(),
  body("numero_caso").isInt({ min: 1 }).toInt(),
  body("titulo").optional({ nullable: true }).isString().isLength({ max: 150 }),
  body("descripcion").optional({ nullable: true }).isString().isLength({ max: 500 }),

  validate,
  ctrl.create
);

// ===============================
// UPDATE
// PUT /api/casos-estudio/:id_caso_estudio (multipart/form-data)
// fields opcionales: numero_caso?, titulo?, descripcion?, archivo?
// (igual manda id_carrera_periodo si tu lógica lo necesita)
// ===============================
router.put(
  "/:id_caso_estudio",
  authorize(["ADMIN"]),
  upload.single("archivo"),

  param("id_caso_estudio").isInt({ min: 1 }).toInt(),

  // si quieres permitir cambiar carrera_periodo en edit:
  body("id_carrera_periodo").optional().isInt({ min: 1 }).toInt(),

  body("numero_caso").optional().isInt({ min: 1 }).toInt(),
  body("titulo").optional({ nullable: true }).isString().isLength({ max: 150 }),
  body("descripcion").optional({ nullable: true }).isString().isLength({ max: 500 }),

  validate,
  ctrl.update
);

// ===============================
// (opcional pero recomendado) TOGGLE ESTADO
// PATCH /api/casos-estudio/:id/estado { estado: 0|1 }
// ===============================
router.patch(
  "/:id_caso_estudio/estado",
  authorize(["ADMIN"]),
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  body("estado").isInt().custom((v) => v === 0 || v === 1),
  validate,
  ctrl.toggleEstado
);

// ===============================
// (opcional) DOWNLOAD
// GET /api/casos-estudio/:id/download
// ===============================
router.get(
  "/:id_caso_estudio/download",
  authorize(["ADMIN"]),
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.download
);

module.exports = router;
