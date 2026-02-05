const svc = require("../services/calificadores_generales.service");

async function list(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const includeInactive = req.query.includeInactive === true;
    const data = await svc.list(cp, includeInactive);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function add(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id = await svc.add(cp, Number(req.body.id_carrera_docente));
    res.status(201).json({ ok: true, id });
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    await svc.remove(Number(req.params.id_cp_calificador_general));
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = { list, add, remove };
