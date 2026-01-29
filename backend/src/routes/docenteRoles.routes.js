const router = require("express").Router();
const { param, body } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const ctrl = require("../controllers/docenteRoles.controller");
const { auth, authorize } = require("../middlewares/auth.middleware");

router.get(
  "/docentes/:id/roles",
  auth,
  authorize(["SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.getRoles
);

router.put(
  "/docentes/:id/roles",
  auth,
  authorize(["SUPER_ADMIN"]),
  param("id").isInt({ min: 1 }).toInt(),
  body("roleIds").isArray(),
  body("roleIds.*").isInt({ min: 1 }).toInt(),
  validate,
  ctrl.setRoles
);

module.exports = router;
