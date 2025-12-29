const repo = require("../repositories/rubrica.repo");

async function list({ includeInactive = false, periodoId = null, tipo_rubrica = null }) {
  return repo.findAll({ includeInactive, periodoId, tipo_rubrica });
}

async function get(id) {
  const row = await repo.findById(id);
  if (!row) {
    const e = new Error("Rúbrica no encontrada");
    e.status = 404;
    throw e;
  }
  return row;
}

async function create(d) {
  const pid = Number(d.id_periodo);
  if (!(await repo.periodoExists(pid))) {
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }

  return repo.create({
    id_periodo: pid,
    tipo_rubrica: d.tipo_rubrica,
    ponderacion_global: d.ponderacion_global ?? 50.0,
    nombre_rubrica: d.nombre_rubrica,
    descripcion_rubrica: d.descripcion_rubrica ?? null,
  });
}

async function ensure({ id_periodo, tipo_rubrica, nombre_base }) {
  const pid = Number(id_periodo);

  if (!(await repo.periodoExists(pid))) {
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }

  const existing = await repo.findByPeriodoTipo(pid, tipo_rubrica);
  if (existing) return { created: false, rubrica: existing };

  const base = (nombre_base && String(nombre_base).trim()) ? String(nombre_base).trim() : "Rúbrica Complexivo";
  const nombre = `${base} (${tipo_rubrica})`;

  const created = await repo.create({
    id_periodo: pid,
    tipo_rubrica,
    ponderacion_global: 50.0,
    nombre_rubrica: nombre,
    descripcion_rubrica: null,
  });

  return { created: true, rubrica: created };
}

async function update(id, d) {
  await get(id);

  const pid = Number(d.id_periodo);
  if (!(await repo.periodoExists(pid))) {
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }

  return repo.update(id, {
    id_periodo: pid,
    tipo_rubrica: d.tipo_rubrica,
    ponderacion_global: d.ponderacion_global ?? 50.0,
    nombre_rubrica: d.nombre_rubrica,
    descripcion_rubrica: d.descripcion_rubrica ?? null,
  });
}

async function changeEstado(id, estado) {
  await get(id);
  await repo.setEstado(id, estado ? 1 : 0);
  return { updated: true };
}

module.exports = { list, get, create, ensure, update, changeEstado };
