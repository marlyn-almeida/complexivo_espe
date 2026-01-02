const router = require("express").Router();
const { body } = require("express-validator");

const validate = require("../middlewares/validate.middleware");
const { auth } = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/perfil.controller");

// GET /api/perfil/me
router.get("/me", auth, ctrl.me);

// PATCH /api/perfil/password
router.patch(
  "/password",
  auth,
  body("newPassword").isString().isLength({ min: 6 }).withMessage("Mínimo 6 caracteres"),
  body("confirmPassword").isString().notEmpty().withMessage("Confirmación requerida"),
  validate,
  ctrl.changePassword
);

module.exports = router;
