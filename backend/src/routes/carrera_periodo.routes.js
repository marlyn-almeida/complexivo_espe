const express = require("express");
const { body, param, query } = require("express-validator");
const ctrl = require("../controllers/carrera_periodo.controller");

const router = express.Router();

router.get(
  "/",
  [
    query("includeInactive")
      .optional()
      .isIn(["true", "false"])
      .withMessage("includeInactive debe ser true/false"),
    query("carreraId").optional().isInt({ min: 1 }).withMessage("carreraId inválido"),
    query("periodoId").optional().isInt({ min: 1 }).withMessage("periodoId inválido"),
    query("q").optional().isString(),
  ],
  ctrl.list
);

router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("id inválido")],
  ctrl.getById
);

router.post(
  "/",
  [
    body("id_carrera").isInt({ min: 1 }).withMessage("id_carrera es obligatorio"),
    body("id_periodo").isInt({ min: 1 }).withMessage("id_periodo es obligatorio"),
  ],
  ctrl.create
);

// ✅ nuevo bulk
router.post(
  "/bulk",
  [
    body("id_periodo").isInt({ min: 1 }).withMessage("id_periodo es obligatorio"),
    body("carreraIds").isArray({ min: 1 }).withMessage("carreraIds debe ser un arreglo con al menos 1"),
    body("carreraIds.*").isInt({ min: 1 }).withMessage("carreraIds contiene valores inválidos"),
  ],
  ctrl.bulk
);

router.put(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("id inválido"),
    body("id_carrera").isInt({ min: 1 }).withMessage("id_carrera es obligatorio"),
    body("id_periodo").isInt({ min: 1 }).withMessage("id_periodo es obligatorio"),
  ],
  ctrl.update
);

router.patch(
  "/:id/estado",
  [
    param("id").isInt({ min: 1 }).withMessage("id inválido"),
    body("estado").exists().withMessage("estado es obligatorio"),
  ],
  ctrl.patchEstado
);

module.exports = router;
