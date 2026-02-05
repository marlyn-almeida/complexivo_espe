// src/routes/plan_evaluacion_item.routes.js
const router = require("express").Router();
const { body, param } = require("express-validator");

const validate = require("../middlewares/validate.middleware");
const { auth, authorize } = require("../middlewares/auth.middleware");
const attachCarreraPeriodoCtx = require("../middlewares/attachCarreraPeriodoCtx.middleware");

const ctrl = require("../controllers/plan_evaluacion_item.controller");

// 🔐 Todo esto va con CP activo
router.use(auth);
router.use(authorize([1, 2])); // SuperAdmin + Admin (ajusta si quieres)
router.use(attachCarreraPeriodoCtx);

/* =========================
   PLAN (1 por CP)
   ========================= */

// Obtener plan del CP (si no existe => null)
router.get("/plan", ctrl.getPlanByCP);

// Crear plan en el CP (si ya existe => error)
router.post(
  "/plan",
  body("nombre_plan").isString().trim().isLength({ min: 3, max: 200 }),
  body("descripcion_plan").optional().isString().trim().isLength({ max: 600 }),
  validate,
  ctrl.createPlan
);

// Actualizar plan
router.patch(
  "/plan/:id_plan_evaluacion",
  param("id_plan_evaluacion").isInt({ min: 1 }).toInt(),
  body("nombre_plan").optional().isString().trim().isLength({ min: 3, max: 200 }),
  body("descripcion_plan").optional().isString().trim().isLength({ max: 600 }),
  body("estado").optional().isBoolean().toBoolean(),
  validate,
  ctrl.updatePlan
);

/* =========================
   ÍTEMS
   ========================= */

// Listar ítems del plan
router.get(
  "/plan/:id_plan_evaluacion/items",
  param("id_plan_evaluacion").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.listItems
);

// Crear ítem en plan
router.post(
  "/plan/:id_plan_evaluacion/items",
  param("id_plan_evaluacion").isInt({ min: 1 }).toInt(),
  body("nombre_item").isString().trim().isLength({ min: 3, max: 200 }),
  body("tipo_item").isIn(["NOTA_DIRECTA", "RUBRICA"]),
  body("ponderacion_global_pct").isFloat({ min: 0, max: 100 }).toFloat(),
  body("calificado_por").isIn(["ROL2", "TRIBUNAL", "CALIFICADORES_GENERALES"]),
  body("id_rubrica").optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  validate,
  ctrl.createItem
);

// Actualizar ítem
router.patch(
  "/items/:id_plan_item",
  param("id_plan_item").isInt({ min: 1 }).toInt(),
  body("nombre_item").optional().isString().trim().isLength({ min: 3, max: 200 }),
  body("tipo_item").optional().isIn(["NOTA_DIRECTA", "RUBRICA"]),
  body("ponderacion_global_pct").optional().isFloat({ min: 0, max: 100 }).toFloat(),
  body("calificado_por").optional().isIn(["ROL2", "TRIBUNAL", "CALIFICADORES_GENERALES"]),
  body("id_rubrica").optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  body("estado").optional().isBoolean().toBoolean(),
  validate,
  ctrl.updateItem
);

/* =========================
   RÚBRICA: calificador por componente
   (ya lo tenías)
   ========================= */

// Listar asignación de calificadores por componente de un ítem RUBRICA
router.get(
  "/items/:id_plan_item/componentes-calificadores",
  param("id_plan_item").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.listComponentCalificadores
);

// Set calificador por componente
router.put(
  "/items/:id_plan_item/componentes/:id_rubrica_componente/calificador",
  param("id_plan_item").isInt({ min: 1 }).toInt(),
  param("id_rubrica_componente").isInt({ min: 1 }).toInt(),
  body("calificado_por").isIn(["ROL2", "TRIBUNAL", "CALIFICADORES_GENERALES"]),
  validate,
  ctrl.setComponentCalificador
);

/* =========================
   ✅ NUEVO: Calificadores Generales por ÍTEM NO RÚBRICA
   ========================= */

// Listar docentes (calificadores generales) asignados al ítem
router.get(
  "/items/:id_plan_item/calificadores-generales",
  param("id_plan_item").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.listItemCalificadoresGenerales
);

// Reemplazar lista de calificadores generales del ítem (PUT = reemplazo total)
router.put(
  "/items/:id_plan_item/calificadores-generales",
  param("id_plan_item").isInt({ min: 1 }).toInt(),
  body("ids_cp_calificador_general").isArray({ min: 0 }),
  body("ids_cp_calificador_general.*").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.setItemCalificadoresGenerales
);

module.exports = router;
