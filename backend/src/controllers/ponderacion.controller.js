const svc = require("../services/ponderacion.service");

async function get(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const data = await svc.get(cp);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function upsert(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    await svc.upsert(cp, req.body);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = { get, upsert };
