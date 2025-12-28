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

async function list(req, res, next) {
  try {
    const data = await service.list(req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const row = await service.getById(id);
    if (!row) return res.status(404).json({ message: "No encontrado" });
    res.json(row);
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const row = await service.create(req.body);
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const id = Number(req.params.id);
    const row = await service.update(id, req.body);
    res.json(row);
  } catch (e) {
    next(e);
  }
}

async function patchEstado(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const id = Number(req.params.id);
    const row = await service.changeEstado(id, req.body.estado);
    res.json(row);
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

module.exports = { list, getById, create, update, patchEstado, bulk };
