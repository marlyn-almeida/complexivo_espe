const service = require("../services/departamento.service");

async function list(req, res) {
  const includeInactive = req.query.includeInactive === true; // ya viene boolean por toBoolean()
  const q = String(req.query.q || "");

  const rows = await service.list({ includeInactive, q });
  return res.json(rows);
}

async function getById(req, res) {
  const id = Number(req.params.id);
  const row = await service.getById(id);
  return res.json(row);
}

async function create(req, res) {
  const row = await service.create(req.body);
  return res.status(201).json(row);
}

async function update(req, res) {
  const id = Number(req.params.id);
  const row = await service.update(id, req.body);
  return res.json(row);
}

async function setEstado(req, res) {
  const id = Number(req.params.id);
  const { estado } = req.body;
  const row = await service.setEstado(id, estado);
  return res.json(row);
}

module.exports = { list, getById, create, update, setEstado };
