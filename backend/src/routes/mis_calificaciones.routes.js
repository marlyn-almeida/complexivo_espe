// ✅ src/routes/mis_calificaciones.routes.js
const router = require("express").Router();
const validate = require("../middlewares/validate.middleware");
const { authorize, auth } = require("../middlewares/auth.middleware");
const { attachCarreraPeriodoCtx } = require("../middlewares/ctx.middleware");
const ctrl = require("../controllers/mis_calificaciones.controller");

router.get(
  "/",
  auth,
  authorize(["ADMIN"]),
  attachCarreraPeriodoCtx,
  validate,
  ctrl.list
);

module.exports = router;
