const svc = require("../services/nota_teorico.service");

async function get(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_estudiante = Number(req.params.id_estudiante);
    const data = await svc.get(cp, id_estudiante);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function upsert(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_docente_registra = Number(req.user.id);
    await svc.upsert(cp, id_docente_registra, req.body);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = { get, upsert };
