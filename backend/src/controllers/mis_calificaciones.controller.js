// ✅ src/controllers/mis_calificaciones.controller.js
const svc = require("../services/mis_calificaciones.service");

async function list(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const data = await svc.list(cp, req.user);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = { list };
