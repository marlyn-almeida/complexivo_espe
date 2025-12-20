const repo = require("../repositories/departamento.repo");

async function list({ includeInactive = false, q = "" } = {}) {
  return repo.findAll({ includeInactive, q });
}

async function getById(id) {
  const row = await repo.findById(id);
  if (!row) {
    const err = new Error("Departamento no encontrado");
    err.status = 404;
    throw err;
  }
  return row;
}

async function create(data) {
  // normalizar
  const nombre = (data.nombre_departamento || "").trim().replace(/\s+/g, " ");
  const desc = (data.descripcion_departamento || "").trim().replace(/\s+/g, " ");

  if (!nombre) {
    const err = new Error("nombre_departamento es obligatorio");
    err.status = 400;
    throw err;
  }
  if (nombre.length > 100) {
    const err = new Error("nombre_departamento máximo 100 caracteres");
    err.status = 400;
    throw err;
  }
  if (desc.length > 200) {
    const err = new Error("descripcion_departamento máximo 200 caracteres");
    err.status = 400;
    throw err;
  }

  const exists = await repo.findByNombre(nombre);
  if (exists) {
    const err = new Error("Ya existe un departamento con ese nombre");
    err.status = 409;
    throw err;
  }

  return repo.create({
    nombre_departamento: nombre,
    descripcion_departamento: desc ? desc : null,
  });
}

async function update(id, data) {
  await getById(id);

  const nombre = (data.nombre_departamento || "").trim().replace(/\s+/g, " ");
  const desc = (data.descripcion_departamento || "").trim().replace(/\s+/g, " ");

  if (!nombre) {
    const err = new Error("nombre_departamento es obligatorio");
    err.status = 400;
    throw err;
  }
  if (nombre.length > 100) {
    const err = new Error("nombre_departamento máximo 100 caracteres");
    err.status = 400;
    throw err;
  }
  if (desc.length > 200) {
    const err = new Error("descripcion_departamento máximo 200 caracteres");
    err.status = 400;
    throw err;
  }

  const exists = await repo.findByNombre(nombre);
  if (exists && Number(exists.id_departamento) !== Number(id)) {
    const err = new Error("Ya existe un departamento con ese nombre");
    err.status = 409;
    throw err;
  }

  return repo.update(id, {
    nombre_departamento: nombre,
    descripcion_departamento: desc ? desc : null,
  });
}

async function toggleEstado(id, estado) {
  await getById(id);
  return repo.setEstado(id, !!estado);
}

module.exports = {
  list,
  getById,
  create,
  update,
  toggleEstado,
};
