const service = require("../services/rol.service");

async function list(req, res, next) {
  try {
    res.json(await service.list(req.query));
  } catch (e) { next(e); }
}

async function get(req, res, next) {
  try {
    res.json(await service.get(req.params.id));
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const created = await service.create(req.body);
    res.status(201).json(created);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    res.json(await service.update(req.params.id, req.body));
  } catch (e) { next(e); }
}

async function changeEstado(req, res, next) {
  try {
    res.json(await service.changeEstado(req.params.id, req.body.estado));
  } catch (e) { next(e); }
}

module.exports = { list, get, create, update, changeEstado };
