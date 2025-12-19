const repo = require("../repositories/carrera.repo");

async function list(query = {}) {
  const includeInactive = query.includeInactive === "true";
  const q = query.q || "";
  const page = query.page || 1;
  const limit = query.limit || 50;
  const departamentoId = query.departamentoId || null;

  return repo.findAll({ includeInactive, q, page, limit, departamentoId });
}

async function get(id) {
  const carrera = await repo.findById(id);
  if (!carrera) {
    const err = new Error("Carrera no encontrada");
    err.status = 404;
    throw err;
  }
  return carrera;
}

async function create(payload) {
  // Validar FK departamento
  const depOk = await repo.departamentoExists(payload.id_departamento);
  if (!depOk) {
    const err = new Error("El departamento no existe");
    err.status = 422;
    throw err;
  }

  // Duplicados por UNIQUE
  const byNombre = await repo.findByNombre(payload.nombre_carrera);
  if (byNombre) { const err = new Error("Ya existe una carrera con ese nombre"); err.status = 409; throw err; }

  const byCodigo = await repo.findByCodigo(payload.codigo_carrera);
  if (byCodigo) { const err = new Error("Ya existe una carrera con ese código"); err.status = 409; throw err; }

  return repo.create(payload);
}

async function update(id, payload) {
  await get(id);

  const depOk = await repo.departamentoExists(payload.id_departamento);
  if (!depOk) {
    const err = new Error("El departamento no existe");
    err.status = 422;
    throw err;
  }

  const byNombre = await repo.findByNombre(payload.nombre_carrera);
  if (byNombre && Number(byNombre.id_carrera) !== Number(id)) {
    const err = new Error("Ya existe una carrera con ese nombre");
    err.status = 409;
    throw err;
  }

  const byCodigo = await repo.findByCodigo(payload.codigo_carrera);
  if (byCodigo && Number(byCodigo.id_carrera) !== Number(id)) {
    const err = new Error("Ya existe una carrera con ese código");
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
