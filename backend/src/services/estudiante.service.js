const repo = require("../repositories/estudiante.repo");

async function list(query = {}) {
  const includeInactive = query.includeInactive === "true";
  const q = query.q || "";
  const page = query.page || 1;
  const limit = query.limit || 50;
  const carreraPeriodoId = query.carreraPeriodoId || null;

  return repo.findAll({ includeInactive, q, page, limit, carreraPeriodoId });
}

async function get(id) {
  const e = await repo.findById(id);
  if (!e) { const err = new Error("Estudiante no encontrado"); err.status = 404; throw err; }
  return e;
}

async function create(payload) {
  // FK: carrera_periodo debe existir
  const ok = await repo.carreraPeriodoExists(payload.id_carrera_periodo);
  if (!ok) { const err = new Error("La relación carrera_periodo no existe"); err.status = 422; throw err; }

  // UNIQUE institucional
  const dup = await repo.findByInstitucional(payload.id_institucional_estudiante);
  if (dup) { const err = new Error("Ya existe un estudiante con ese ID institucional"); err.status = 409; throw err; }

  return repo.create(payload);
}

async function update(id, payload) {
  await get(id);

  const ok = await repo.carreraPeriodoExists(payload.id_carrera_periodo);
  if (!ok) { const err = new Error("La relación carrera_periodo no existe"); err.status = 422; throw err; }

  const dup = await repo.findByInstitucional(payload.id_institucional_estudiante);
  if (dup && Number(dup.id_estudiante) !== Number(id)) {
    const err = new Error("Ya existe un estudiante con ese ID institucional");
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
