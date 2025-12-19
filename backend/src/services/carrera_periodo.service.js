const repo = require("../repositories/carrera_periodo.repo");

async function list(q) {
  return repo.list({
    includeInactive: q.includeInactive === "true",
    carreraId: q.carreraId || null,
    periodoId: q.periodoId || null
  });
}

async function create(d) {
  // tu repo.create recibe (carreraId, periodoId)
  return repo.create(d.id_carrera, d.id_periodo);
}

async function changeEstado(id, estado) {
  return repo.setEstado(id, estado);
}

module.exports = { list, create, changeEstado };
