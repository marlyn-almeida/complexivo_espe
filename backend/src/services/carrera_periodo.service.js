const repo = require("../repositories/carrera_periodo.repo");

async function resumen(q) {
  return repo.resumen(q);
}

async function listByPeriodo({ periodoId, includeInactive = "false", q = "" }) {
  return repo.listByPeriodo({
    periodoId: Number(periodoId),
    includeInactive: includeInactive === "true" || includeInactive === true,
    q: (q || "").trim(),
  });
}

// ✅ FIX: mapear id_periodo -> periodoId
async function bulkAssign(payload) {
  const periodoId = payload.periodoId ?? payload.id_periodo;
  return repo.bulkAssign({
    ...payload,
    periodoId: Number(periodoId),
  });
}

// ✅ FIX: mapear id_periodo -> periodoId
async function syncPeriodo(payload) {
  const periodoId = payload.periodoId ?? payload.id_periodo;
  return repo.syncPeriodo({
    ...payload,
    periodoId: Number(periodoId),
  });
}

/**
 * ✅ NUEVO
 * Lista completa carrera_periodo + joins
 */
async function list({ includeInactive = false, q = "", periodoId = null }) {
  return repo.list({
    includeInactive: includeInactive === true || includeInactive === "true",
    q: (q || "").trim(),
    periodoId: periodoId ? Number(periodoId) : null,
  });
}

module.exports = {
  resumen,
  listByPeriodo,
  bulkAssign,
  syncPeriodo,
  list,
};
