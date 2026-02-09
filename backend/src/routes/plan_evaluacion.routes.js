// plan_evaluacion.routes.js
const router = require("express").Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");
const ctrl = require("../controllers/plan_evaluacion.controller");

// 👇 APLICA EL CTX MIDDLEWARE AQUÍ (usa x-carrera-periodo-id)
router.use(attachCarreraPeriodoCtx);

// =====================
// ADMIN
// =====================
router.get("/", authorize(["ADMIN"]), ctrl.getByCP);

router.post(
  "/",
  authorize(["ADMIN"]),
  body("nombre_plan").isString().isLength({ min: 1, max: 200 }),
  body("descripcion_plan").optional().isString().isLength({ max: 600 }),
  validate,
  ctrl.create
);

router.put(
  "/:id_plan_evaluacion",
  authorize(["ADMIN"]),
  param("id_plan_evaluacion").isInt({ min: 1 }).toInt(),
  body("nombre_plan").optional().isString().isLength({ max: 200 }),
  body("descripcion_plan").optional().isString().isLength({ max: 600 }),
  body("estado").optional().isBoolean().toBoolean(),
  validate,
  ctrl.update
);

router.get(
  "/:id_plan_evaluacion/items",
  authorize(["ADMIN"]),
  param("id_plan_evaluacion").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.listItems
);

router.post(
  "/items",
  authorize(["ADMIN"]),
  body("id_plan_evaluacion").isInt({ min: 1 }).toInt(),
  body("nombre_item").isString().isLength({ min: 1, max: 200 }),
  body("tipo_item").isIn(["NOTA_DIRECTA", "CUESTIONARIO", "RUBRICA"]),
  body("ponderacion_global_pct").isFloat({ min: 0, max: 100 }).toFloat(),
  body("calificado_por").isIn(["ROL2", "TRIBUNAL", "CALIFICADORES_GENERALES"]),
  body("id_rubrica").optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  validate,
  ctrl.createItem
);

router.put(
  "/items/:id_plan_item",
  authorize(["ADMIN"]),
  param("id_plan_item").isInt({ min: 1 }).toInt(),
  body("nombre_item").optional().isString().isLength({ max: 200 }),
  body("ponderacion_global_pct").optional().isFloat({ min: 0, max: 100 }).toFloat(),
  body("calificado_por").optional().isIn(["ROL2", "TRIBUNAL", "CALIFICADORES_GENERALES"]),
  body("id_rubrica").optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  body("estado").optional().isBoolean().toBoolean(),
  validate,
  ctrl.updateItem
);

router.post(
  "/items/componentes/calificador",
  authorize(["ADMIN"]),
  body("id_plan_item").isInt({ min: 1 }).toInt(),
  body("id_rubrica_componente").isInt({ min: 1 }).toInt(),
  body("calificado_por").isIn(["ROL2", "TRIBUNAL", "CALIFICADORES_GENERALES"]),
  // 👇 si tú ya agregaste la columna designacion_tribunal (enum), debes validarla aquí:
  body("designacion_tribunal")
    .optional()
    .isIn(["PRESIDENTE", "INTEGRANTE_1", "INTEGRANTE_2", "TODOS"]),
  validate,
  ctrl.setComponentCalificador
);

router.get(
  "/items/:id_plan_item/componentes/calificador",
  authorize(["ADMIN"]),
  param("id_plan_item").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.listComponentCalificadores
);

// =====================
// DOCENTE (ROL 3)
// =====================
// ✅ Mis componentes a calificar según plan y mi designación
router.get(
  "/mis-items/:id_tribunal_estudiante",
  authorize(["DOCENTE"]),
  param("id_tribunal_estudiante").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.misItemsTribunal
);

module.exports = router;
