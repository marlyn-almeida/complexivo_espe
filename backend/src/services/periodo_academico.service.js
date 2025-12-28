const repo = require("../repositories/periodo_academico.repo");

// ✅ valida "YYYY-MM-DD" sin timezone
function isYYYYMMDD(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// ✅ valida existencia real del día (no 2025-02-31)
function isRealDateYYYYMMDD(s) {
  if (!isYYYYMMDD(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function validarFechas(fi, ff) {
  if (!isRealDateYYYYMMDD(fi) || !isRealDateYYYYMMDD(ff)) {
    const e = new Error("fecha_inicio y fecha_fin deben ser fechas válidas (YYYY-MM-DD)");
    e.status = 422;
    throw e;
  }

  // ✅ comparación segura por string (YYYY-MM-DD ordena naturalmente)
  if (ff < fi) {
    const e = new Error("fecha_fin no puede ser menor que fecha_inicio");
    e.status = 422;
    throw e;
  }
}

async function list(q) {
  return repo.findAll({
    includeInactive: q.includeInactive === "true",
    q: q.q || null,
  });
}

async function get(id) {
  const p = await repo.findById(id);
  if (!p) {
    const e = new Error("Periodo académico no encontrado");
    e.status = 404;
    throw e;
  }
  return p;
}

async function create(d) {
  validarFechas(d.fecha_inicio, d.fecha_fin);

  const dup = await repo.existsCodigo(d.codigo_periodo);
  if (dup) {
    const e = new Error("codigo_periodo ya existe");
    e.status = 409;
    throw e;
  }

  // ✅ forzar strings limpias
  const payload = {
    ...d,
    fecha_inicio: String(d.fecha_inicio).slice(0, 10),
    fecha_fin: String(d.fecha_fin).slice(0, 10),
  };

  return repo.create(payload);
}

async function update(id, d) {
  await get(id);
  validarFechas(d.fecha_inicio, d.fecha_fin);

  const dup = await repo.existsCodigo(d.codigo_periodo);
  if (dup && +dup.id_periodo !== +id) {
    const e = new Error("codigo_periodo ya existe");
    e.status = 409;
    throw e;
  }

  const payload = {
    ...d,
    fecha_inicio: String(d.fecha_inicio).slice(0, 10),
    fecha_fin: String(d.fecha_fin).slice(0, 10),
  };

  return repo.update(id, payload);
}

async function changeEstado(id, estado) {
  await get(id);
  return repo.setEstado(id, estado);
}

module.exports = { list, get, create, update, changeEstado };
