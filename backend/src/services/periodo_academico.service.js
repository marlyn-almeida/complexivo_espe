const repo = require("../repositories/periodo_academico.repo");

function validarFechas(fi, ff) {
  const ini = new Date(fi);
  const fin = new Date(ff);
  if (Number.isNaN(ini.getTime()) || Number.isNaN(fin.getTime())) {
    const e = new Error("fecha_inicio y fecha_fin deben ser fechas válidas (YYYY-MM-DD)");
    e.status = 422; throw e;
  }
  if (fin < ini) {
    const e = new Error("fecha_fin no puede ser menor que fecha_inicio");
    e.status = 422; throw e;
  }
}

async function list(q) {
  return repo.findAll({
    includeInactive: q.includeInactive === "true",
    q: q.q || null
  });
}

async function get(id) {
  const p = await repo.findById(id);
  if (!p) { const e = new Error("Periodo académico no encontrado"); e.status = 404; throw e; }
  return p;
}

async function create(d) {
  validarFechas(d.fecha_inicio, d.fecha_fin);

  const dup = await repo.existsCodigo(d.codigo_periodo);
  if (dup) { const e = new Error("codigo_periodo ya existe"); e.status = 409; throw e; }

  return repo.create(d);
}

async function update(id, d) {
  await get(id);
  validarFechas(d.fecha_inicio, d.fecha_fin);
  // si cambia el código, evitar duplicado
  const dup = await repo.existsCodigo(d.codigo_periodo);
  if (dup && +dup.id_periodo !== +id) { const e = new Error("codigo_periodo ya existe"); e.status = 409; throw e; }
  return repo.update(id, d);
}

async function changeEstado(id, estado) { await get(id); return repo.setEstado(id, estado); }

module.exports = { list, get, create, update, changeEstado };
