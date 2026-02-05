// src/routes/entregas_caso.routes.js
const router = require("express").Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { authorize } = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/entregas_caso.controller");

const multer = require("multer");

// ✅ Upload en memoria (como casos de estudio)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// ✅ GET entrega por estudiante y caso
router.get(
  "/:id_estudiante/:id_caso_estudio",
  authorize(["ADMIN", "DOCENTE"]),
  param("id_estudiante").isInt({ min: 1 }).toInt(),
  param("id_caso_estudio").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.get
);

// ✅ POST subida PDF (multipart)
// FormData: id_estudiante, id_caso_estudio, archivo, observacion?
router.post(
  "/",
  authorize(["ADMIN"]),
  upload.single("archivo"), // 👈 FormData debe mandar "archivo"
  body("id_estudiante").isInt({ min: 1 }).toInt(),
  body("id_caso_estudio").isInt({ min: 1 }).toInt(),
  body("observacion").optional().isString().isLength({ max: 400 }),
  validate,
  ctrl.upsert
);

module.exports = router;
