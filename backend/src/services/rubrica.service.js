const repo = require("../repositories/rubrica.repo");

async function list({ includeInactive = false, periodoId = null }) {
  return repo.findAll({ includeInactive, periodoId });
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

async function getByPeriodo(id_periodo) {
  const pid = Number(id_periodo);
  if (!(await repo.periodoExists(pid))) {
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }
  const row = await repo.findByPeriodo(pid);
  if (!row) {
    const e = new Error("No existe rúbrica para este período");
    e.status = 404;
    throw e;
  }
  return row;
}

// crea si no existe. Si existe, devuelve la misma.
async function ensureByPeriodo(id_periodo, payload = {}) {
  const pid = Number(id_periodo);

  if (!(await repo.periodoExists(pid))) {
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }

  const existing = await repo.findByPeriodo(pid);
  if (existing) return { created: false, rubrica: existing };

  const nombre = (payload.nombre_rubrica && String(payload.nombre_rubrica).trim())
    ? String(payload.nombre_rubrica).trim()
    : `Rúbrica del período #${pid}`;

  const descripcion = payload.descripcion_rubrica ?? null;
  const ponderacion = payload.ponderacion_global ?? 50.0;

  const created = await repo.create({
    id_periodo: pid,
    nombre_rubrica: nombre,
    descripcion_rubrica: descripcion,
    ponderacion_global: ponderacion,
  });

  return { created: true, rubrica: created };
}

async function update(id, payload) {
  await get(id);

  const nombre = String(payload.nombre_rubrica || "").trim();
  if (!nombre) {
    const e = new Error("nombre_rubrica es obligatorio");
    e.status = 422;
    throw e;
  }

  const out = await repo.update(id, {
    nombre_rubrica: nombre,
    descripcion_rubrica: payload.descripcion_rubrica ?? null,
    ponderacion_global: payload.ponderacion_global ?? 50.0,
  });

  return out;
}

async function changeEstado(id, estado) {
  await get(id);
  await repo.setEstado(id, estado ? 1 : 0);
  return { updated: true };
}

module.exports = {
  list,
  get,
  getByPeriodo,
  ensureByPeriodo,
  update,
  changeEstado,
};
