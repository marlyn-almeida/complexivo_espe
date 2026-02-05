const repo = require("../repositories/casos_estudio.repo");

async function list(reqCtxCp, includeInactive) {
  return repo.listByCP(reqCtxCp, { includeInactive });
}

async function create(reqCtxCp, data) {
  return repo.create({
    ...data,
    id_carrera_periodo: reqCtxCp,
  });
}

async function update(reqCtxCp, id_caso_estudio, patch) {
  const existing = await repo.getById(id_caso_estudio);

  if (!existing) {
    const e = new Error("Caso de estudio no encontrado");
    e.status = 404;
    throw e;
  }

  if (Number(existing.id_carrera_periodo) !== Number(reqCtxCp)) {
    const e = new Error("Caso fuera de tu carrera–período");
    e.status = 403;
    throw e;
  }

  await repo.update(id_caso_estudio, patch);
  return true;
}

module.exports = { list, create, update };
