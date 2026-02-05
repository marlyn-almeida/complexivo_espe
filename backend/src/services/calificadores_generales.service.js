const repo = require("../repositories/calificadores_generales.repo");

async function list(cp, includeInactive) {
  return repo.listByCP(cp, { includeInactive });
}

async function add(cp, id_carrera_docente) {
  try {
    return await repo.add(cp, id_carrera_docente);
  } catch (e) {
    if (e?.code === "ER_DUP_ENTRY") {
      const err = new Error("Ya está registrado como calificador general");
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

async function remove(id_cp_calificador_general) {
  const ok = await repo.deactivate(id_cp_calificador_general);
  if (!ok) {
    const err = new Error("Registro no encontrado");
    err.status = 404;
    throw err;
  }
  return true;
}

module.exports = { list, add, remove };
