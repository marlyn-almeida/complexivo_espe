const svc = require("../services/entregas_caso.service");

async function get(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_estudiante = Number(req.params.id_estudiante);
    const id_caso_estudio = Number(req.params.id_caso_estudio);
    const data = await svc.get(cp, id_estudiante, id_caso_estudio);
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
