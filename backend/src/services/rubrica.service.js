const repo = require("../repositories/rubrica.repo");

function normalizeEstado(v) {
  return v === true || Number(v) === 1 ? 1 : 0;
}

async function list({ includeInactive = false, periodoId = null } = {}) {
  return repo.list({ includeInactive, periodoId });
}

async function getByPeriodo(id_periodo) {
  return repo.getByPeriodo(id_periodo);
}

async function ensureByPeriodo(id_periodo, body) {
  // Si ya existe => devolver la existente
  const existing = await repo.getByPeriodo(id_periodo);
  if (existing) {
    return { __created: false, rubrica: existing };
  }

  const payload = {
    id_periodo,
    nombre_rubrica: (body.nombre_rubrica || "Rúbrica del Período").trim(),
    descripcion_rubrica: body.descripcion_rubrica ? String(body.descripcion_rubrica).trim() : null,
    ponderacion_global:
      body.ponderacion_global !== undefined && body.ponderacion_global !== null
        ? Number(body.ponderacion_global)
        : 100,
    estado: 1,
  };

  const id = await repo.create(payload);
  const created = await repo.getById(id);
  return { __created: true, rubrica: created };
}

async function get(id_rubrica) {
  return repo.getById(id_rubrica);
}

async function update(id_rubrica, patch) {
  const exists = await repo.getById(id_rubrica);
  if (!exists) {
    const err = new Error("Rúbrica no encontrada");
    err.status = 404;
    throw err;
  }

  const clean = {
    nombre_rubrica: patch.nombre_rubrica !== undefined ? String(patch.nombre_rubrica).trim() : undefined,
    descripcion_rubrica:
      patch.descripcion_rubrica !== undefined
        ? patch.descripcion_rubrica === null
          ? null
          : String(patch.descripcion_rubrica).trim()
        : undefined,
    ponderacion_global:
      patch.ponderacion_global !== undefined && patch.ponderacion_global !== null
        ? Number(patch.ponderacion_global)
        : undefined,
  };

  const ok = await repo.update(id_rubrica, clean);
  if (!ok) {
    const err = new Error("No se pudo actualizar la rúbrica");
    err.status = 400;
    throw err;
  }
  return true;
}

async function changeEstado(id_rubrica, estadoBool) {
  const exists = await repo.getById(id_rubrica);
  if (!exists) {
    const err = new Error("Rúbrica no encontrada");
    err.status = 404;
    throw err;
  }

  const ok = await repo.changeEstado(id_rubrica, normalizeEstado(estadoBool));
  if (!ok) {
    const err = new Error("No se pudo cambiar el estado");
    err.status = 400;
    throw err;
  }
  return true;
}

async function listComponentes(id_rubrica, { includeInactive = false } = {}) {
  const r = await repo.getById(id_rubrica);
  if (!r) {
    const err = new Error("Rúbrica no encontrada");
    err.status = 404;
    throw err;
  }
  return repo.listComponentes(id_rubrica, { includeInactive });
}

module.exports = {
  list,
  getByPeriodo,
  ensureByPeriodo,
  get,
  update,
  changeEstado,
  listComponentes,
};
