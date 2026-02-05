const svc = require("../services/casos_estudio.service");

async function list(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const includeInactive = req.query.includeInactive === true;
    const data = await svc.list(cp, includeInactive);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id = await svc.create(cp, req.body);
    res.status(201).json({ ok: true, id });
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_caso_estudio = Number(req.params.id_caso_estudio);
    await svc.update(cp, id_caso_estudio, req.body);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = { list, create, update };
