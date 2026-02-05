const svc = require("../services/rubrica.service");

async function list(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === true;
    const periodoId = req.query.periodoId ? Number(req.query.periodoId) : null;

    const data = await svc.list({ includeInactive, periodoId });
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function getByPeriodo(req, res, next) {
  try {
    const id_periodo = Number(req.params.idPeriodo);
    const data = await svc.getByPeriodo(id_periodo);

    if (!data) {
      const err = new Error("Rúbrica no encontrada para el período");
      err.status = 404;
      throw err;
    }

    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function ensureByPeriodo(req, res, next) {
  try {
    const id_periodo = Number(req.params.idPeriodo);
    const data = await svc.ensureByPeriodo(id_periodo, req.body || {});
    // idempotente: si ya existe devuelve 200, si crea devuelve 201
    res.status(data.__created ? 201 : 200).json({ ok: true, data: data.rubrica });
  } catch (e) {
    next(e);
  }
}

async function get(req, res, next) {
  try {
    const id_rubrica = Number(req.params.id);
    const data = await svc.get(id_rubrica);

    if (!data) {
      const err = new Error("Rúbrica no encontrada");
      err.status = 404;
      throw err;
    }

    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const id_rubrica = Number(req.params.id);
    await svc.update(id_rubrica, req.body || {});
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function changeEstado(req, res, next) {
  try {
    const id_rubrica = Number(req.params.id);
    await svc.changeEstado(id_rubrica, req.body.estado === true);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function listComponentes(req, res, next) {
  try {
    const id_rubrica = Number(req.params.id);
    const includeInactive = req.query.includeInactive === true;
    const data = await svc.listComponentes(id_rubrica, { includeInactive });
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  list,
  getByPeriodo,
  ensureByPeriodo,
  get,
  update,
  changeEstado,
  listComponentes,
};
