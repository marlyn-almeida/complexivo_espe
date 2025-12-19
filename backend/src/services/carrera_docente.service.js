const repo = require("../repositories/carrera_docente.repo");

async function list(query = {}) {
  return repo.findAll({
    includeInactive: query.includeInactive === "true",
    docenteId: query.docenteId || null,
    carreraPeriodoId: query.carreraPeriodoId || null,
  });
}

async function create(payload){
  const okDoc = await repo.docenteExists(payload.id_docente);
  if (!okDoc) { const e=new Error("El docente no existe"); e.status=422; throw e; }

  const okCP = await repo.carreraPeriodoExists(payload.id_carrera_periodo);
  if (!okCP) { const e=new Error("La relación carrera_periodo no existe"); e.status=422; throw e; }

  const dup = await repo.exists(payload.id_docente, payload.id_carrera_periodo);
  if (dup) { const e=new Error("El docente ya está asignado a esa carrera_periodo"); e.status=409; throw e; }

  return repo.create(payload.id_docente, payload.id_carrera_periodo);
}

async function changeEstado(id, estado){
  const row = await repo.findById(id);
  if (!row) { const e=new Error("Asignación carrera_docente no encontrada"); e.status=404; throw e; }
  return repo.setEstado(id, estado);
}

module.exports = { list, create, changeEstado };
