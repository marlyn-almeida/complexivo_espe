const repo = require("../repositories/ponderacion.repo");

async function get(cp) {
  return repo.getByCP(cp);
}

async function upsert(cp, body) {
  return repo.upsert({ ...body, id_carrera_periodo: cp });
}

module.exports = { get, upsert };
