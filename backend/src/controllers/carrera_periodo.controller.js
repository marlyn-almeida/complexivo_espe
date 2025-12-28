const service = require("../services/carrera_periodo.service");
const { validationResult } = require("express-validator");

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validación fallida",
      errors: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  return null;
}

async function resumen(req, res, next) {
  try {
    const data = await service.resumen(req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function porPeriodo(req, res, next) {
  try {
    const data = await service.listByPeriodo({
      ...req.query,
      periodoId: req.params.periodoId,
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function bulk(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const result = await service.bulkAssign(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

async function sync(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const result = await service.syncPeriodo(req.body);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
}

module.exports = { resumen, porPeriodo, bulk, sync };
