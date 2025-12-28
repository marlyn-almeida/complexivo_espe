const express = require("express");
const { body, param, query } = require("express-validator");
const ctrl = require("../controllers/carrera_periodo.controller");

const router = express.Router();

// ✅ tabla principal: periodos + conteos
router.get(
  "/resumen",
  [
    query("includeInactive").optional().isIn(["true", "false"]).withMessage("includeInactive debe ser true/false"),
    query("q").optional().isString(),
  ],
  ctrl.resumen
);

// ✅ ver/editar: lista de carreras por periodo
router.get(
  "/por-periodo/:periodoId",
  [
    param("periodoId").isInt({ min: 1 }).withMessage("periodoId inválido"),
    query("includeInactive").optional().isIn(["true", "false"]).withMessage("includeInactive debe ser true/false"),
    query("q").optional().isString(),
  ],
  ctrl.porPeriodo
);

// ✅ Asignar (no quita, activa + inserta)
router.post(
  "/bulk",
  [
    body("id_periodo").isInt({ min: 1 }).withMessage("id_periodo es obligatorio"),
    body("carreraIds").isArray({ min: 1 }).withMessage("carreraIds debe ser arreglo con al menos 1"),
    body("carreraIds.*").isInt({ min: 1 }).withMessage("carreraIds contiene valores inválidos"),
  ],
  ctrl.bulk
);

// ✅ Editar (sync): deja exactamente las seleccionadas activas
router.put(
  "/sync",
  [
    body("id_periodo").isInt({ min: 1 }).withMessage("id_periodo es obligatorio"),
    body("carreraIds").isArray().withMessage("carreraIds debe ser arreglo (puede ser vacío)"),
    body("carreraIds.*").optional().isInt({ min: 1 }).withMessage("carreraIds contiene valores inválidos"),
  ],
  ctrl.sync
);

module.exports = router;
