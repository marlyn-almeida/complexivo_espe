// src/services/casos_estudio.service.js
const repo = require("../repositories/casos_estudio.repo");

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

function isDocente(user) {
  return user?.rol === "DOCENTE";
}

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

  if (!existing) throw err("Caso de estudio no encontrado", 404);

  if (Number(existing.id_carrera_periodo) !== Number(reqCtxCp)) {
    throw err("Caso fuera de tu carrera–período", 403);
  }

  await repo.update(id_caso_estudio, patch);
  return true;
}

/** ✅ NUEVO: borrado real */
async function remove(reqCtxCp, id_caso_estudio) {
  const existing = await repo.getById(id_caso_estudio);

  if (!existing) throw err("Caso de estudio no encontrado", 404);

  if (Number(existing.id_carrera_periodo) !== Number(reqCtxCp)) {
    throw err("Caso fuera de tu carrera–período", 403);
  }

  const affected = await repo.remove(id_caso_estudio);
  if (!affected) throw err("No se pudo eliminar el caso.", 500);

  return true;
}

/**
 * ✅ Para download:
 */
async function getByIdForDownload(reqCtxCp, id_caso_estudio, user) {
  const caso = await repo.getById(id_caso_estudio);
  if (!caso) throw err("Caso de estudio no encontrado", 404);

  if (Number(caso.id_carrera_periodo) !== Number(reqCtxCp)) {
    throw err("Caso fuera de tu carrera–período", 403);
  }

  if (isDocente(user)) {
    const ok = await repo.docentePuedeVerCaso({
      id_docente: Number(user.id),
      id_caso_estudio: Number(id_caso_estudio),
      id_carrera_periodo: Number(reqCtxCp),
    });
    if (!ok) throw err("Acceso denegado: no tienes estudiantes asignados con este caso.", 403);
  }

  return caso;
}

module.exports = { list, create, update, remove, getByIdForDownload };
