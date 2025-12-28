const repo = require("../repositories/carrera_periodo.repo");

async function list(q) {
  return repo.list({
    includeInactive: q.includeInactive === "true",
    carreraId: q.carreraId || null,
    periodoId: q.periodoId || null,
    q: q.q || "",
  });
}

async function getById(id) {
  return repo.findById(id);
}

async function create(d) {
  return repo.create(d.id_carrera, d.id_periodo);
}

async function update(id, d) {
  return repo.update(id, d.id_carrera, d.id_periodo);
}

async function changeEstado(id, estado) {
  return repo.setEstado(id, estado);
}

async function bulkAssign(d) {
  return repo.bulkCreateByPeriodo(d.id_periodo, d.carreraIds);
}

module.exports = { list, getById, create, update, changeEstado, bulkAssign };
