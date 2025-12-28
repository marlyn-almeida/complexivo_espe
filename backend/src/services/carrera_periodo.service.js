const repo = require("../repositories/carrera_periodo.repo");

async function resumen(q) {
  return repo.resumen({
    q: q.q || "",
    includeInactive: q.includeInactive === "true",
  });
}

async function listByPeriodo(q) {
  return repo.listByPeriodo({
    periodoId: q.periodoId,
    includeInactive: q.includeInactive === "true",
    q: q.q || "",
  });
}

async function bulkAssign(d) {
  return repo.bulkAssign({
    periodoId: d.id_periodo,
    carreraIds: d.carreraIds,
  });
}

async function syncPeriodo(d) {
  return repo.syncPeriodo({
    periodoId: d.id_periodo,
    carreraIds: d.carreraIds,
  });
}

module.exports = { resumen, listByPeriodo, bulkAssign, syncPeriodo };
