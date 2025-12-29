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

const repo = require("../repositories/carrera_periodo.repo");

exports.list = async ({ includeInactive = false, q = "", periodoId = null }) => {
  return repo.list({ includeInactive, q, periodoId });
};


module.exports = { resumen, listByPeriodo, bulkAssign, syncPeriodo };
