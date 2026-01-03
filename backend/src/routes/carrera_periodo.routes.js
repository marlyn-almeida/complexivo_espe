const express = require("express");
const { body, param, query } = require("express-validator");
const ctrl = require("../controllers/carrera_periodo.controller");

const router = express.Router();

/**
 * ✅ GET /api/carreras-periodos/list
 * Lista carrera_periodo + joins (para /rubricas)
 */
router.get(
  "/list",
  [
    query("includeInactive")
      .optional()
      .isIn(["true", "false"])
      .withMessage("includeInactive debe ser true/false"),
    query("q").optional().isString(),
    query("periodoId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("periodoId inválido"),
  ],
  ctrl.list
);

/**
 * ✅ GET /api/carreras-periodos/mis-activos
 * Para Rol 2: devuelve SOLO carrera_periodo activos de su carrera (scope)
 */
router.get("/mis-activos", ctrl.misActivos);

/**
 * GET /api/carreras-periodos/resumen
 */
router.get(
  "/resumen",
  [
    query("includeInactive")
      .optional()
      .isIn(["true", "false"])
      .withMessage("includeInactive debe ser true/false"),
    query("q").optional().isString(),
  ],
  ctrl.resumen
);

/**
 * GET /api/carreras-periodos/por-periodo/:periodoId
 */
router.get(
  "/por-periodo/:periodoId",
  [
    param("periodoId").isInt({ min: 1 }).withMessage("periodoId inválido"),
    query("includeInactive")
      .optional()
      .isIn(["true", "false"])
      .withMessage("includeInactive debe ser true/false"),
    query("q").optional().isString(),
  ],
  ctrl.porPeriodo
);

/**
 * POST /api/carreras-periodos/bulk
 */
router.post(
  "/bulk",
  [
    body("id_periodo").isInt({ min: 1 }).withMessage("id_periodo es obligatorio"),
    body("carreraIds").isArray({ min: 1 }).withMessage("carreraIds debe ser un arreglo con al menos 1 elemento"),
    body("carreraIds.*").isInt({ min: 1 }).withMessage("carreraIds contiene valores inválidos"),
  ],
  ctrl.bulk
);

/**
 * PUT /api/carreras-periodos/sync
 */
router.put(
  "/sync",
  [
    body("id_periodo").isInt({ min: 1 }).withMessage("id_periodo es obligatorio"),
    body("carreraIds").isArray().withMessage("carreraIds debe ser un arreglo (puede ser vacío)"),
    body("carreraIds.*").optional().isInt({ min: 1 }).withMessage("carreraIds contiene valores inválidos"),
  ],
  ctrl.sync
);

/**
 * ✅ GET /api/carreras-periodos/:idCarreraPeriodo/admin
 */
router.get(
  "/:idCarreraPeriodo/admin",
  [param("idCarreraPeriodo").isInt({ min: 1 }).withMessage("idCarreraPeriodo inválido")],
  ctrl.getAdmins
);

/**
 * ✅ PUT /api/carreras-periodos/:idCarreraPeriodo/admin
 */
router.put(
  "/:idCarreraPeriodo/admin",
  [
    param("idCarreraPeriodo").isInt({ min: 1 }).withMessage("idCarreraPeriodo inválido"),
    body("id_docente_director").optional().isInt({ min: 1 }).withMessage("id_docente_director inválido"),
    body("id_docente_apoyo").optional().isInt({ min: 1 }).withMessage("id_docente_apoyo inválido"),
  ],
  ctrl.setAdmins
);

module.exports = router;
