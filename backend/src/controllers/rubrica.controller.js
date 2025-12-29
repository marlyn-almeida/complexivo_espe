const service = require("../services/rubrica.service");

exports.list = async (req, res, next) => {
  try {
    const includeInactive = !!req.query.includeInactive;
    const periodoId = req.query.periodoId ? Number(req.query.periodoId) : null;
    const tipo_rubrica = req.query.tipo_rubrica || null;

    const data = await service.list({ includeInactive, periodoId, tipo_rubrica });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const data = await service.get(Number(req.params.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const created = await service.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.ensure = async (req, res, next) => {
  try {
    const out = await service.ensure(req.body);
    res.status(out.created ? 201 : 200).json(out);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await service.update(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.changeEstado = async (req, res, next) => {
  try {
    const out = await service.changeEstado(Number(req.params.id), req.body.estado);
    res.json(out);
  } catch (err) {
    next(err);
  }
};
