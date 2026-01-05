// src/services/rol.service.js
const repo = require("../repositories/rol.repo");

async function list(query = {}) {
  const includeInactive = Boolean(query.includeInactive); // ✅ FIX
  const q = query.q || "";
  const page = query.page || 1;
  const limit = query.limit || 50;

  return repo.findAll({ includeInactive, q, page, limit });
}

async function get(id) {
  const rol = await repo.findById(id);
  if (!rol) {
    const err = new Error("Rol no encontrado");
    err.status = 404;
    throw err;
  }
  return rol;
}

async function create(payload) {
  const existing = await repo.findByName(payload.nombre_rol);
  if (existing) {
    const err = new Error("Ya existe un rol con ese nombre");
    err.status = 409;
    throw err;
  }
  return repo.create(payload);
}

async function update(id, payload) {
  await get(id);

  const existing = await repo.findByName(payload.nombre_rol);
  if (existing && Number(existing.id_rol) !== Number(id)) {
    const err = new Error("Ya existe un rol con ese nombre");
    err.status = 409;
    throw err;
  }
  return repo.update(id, payload);
}

async function changeEstado(id, estado) {
  await get(id);
  return repo.setEstado(id, estado);
}

module.exports = { list, get, create, update, changeEstado };
