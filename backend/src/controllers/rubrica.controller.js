const service = require("../services/rubrica.service");

exports.list = async (req, res, next) => {
  try {
    const includeInactive = !!req.query.includeInactive;
    const periodoId = req.query.periodoId ? Number(req.query.periodoId) : null;
    const data = await service.list({ includeInactive, periodoId });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.get = async (req, res, next) => {
  try {
    const data = await service.get(Number(req.params.id));
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.getByPeriodo = async (req, res, next) => {
  try {
    const data = await service.getByPeriodo(Number(req.params.idPeriodo));
    res.json(data);
  } catch (e) {
    next(e);
  }
};

// crea si no existe (1 por período)
exports.ensureByPeriodo = async (req, res, next) => {
  try {
    const out = await service.ensureByPeriodo(Number(req.params.idPeriodo), req.body);
    res.status(out.created ? 201 : 200).json(out);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await service.update(Number(req.params.id), req.body);
    res.json(updated);
  } catch (e) {
    next(e);
  }
};

exports.changeEstado = async (req, res, next) => {
  try {
    const out = await service.changeEstado(Number(req.params.id), req.body.estado);
    res.json(out);
  } catch (e) {
    next(e);
  }
};
