const repo = require("../repositories/carrera_periodo.repo");
const adminRepo = require("../repositories/carrera_admin.repo");

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
 * ✅ LISTA COMPLETA carrera_periodo + joins
 * - Si scopeCarreraId viene: filtra cp.id_carrera = scopeCarreraId
 */
async function list({ includeInactive = false, q = "", periodoId = null, scopeCarreraId = null }) {
  return repo.list({
    includeInactive: includeInactive === true || includeInactive === "true",
    q: (q || "").trim(),
    periodoId: periodoId ? Number(periodoId) : null,
    scopeCarreraId: scopeCarreraId ? Number(scopeCarreraId) : null,
  });
}

/**
 * ✅ CONTEXTO rol 2:
 * Devuelve SOLO los carrera_periodo ACTIVOS de la carrera del scope.
 */
async function misActivos(user) {
  const activeRole = user?.activeRole ?? user?.rol ?? null;
  if (Number(activeRole) !== 2) return [];

  const id_carrera = Number(user?.scope?.id_carrera || 0);
  if (!id_carrera) return [];

  return repo.list({
    includeInactive: false,
    q: "",
    periodoId: null,
    scopeCarreraId: id_carrera,
  });
}

/**
 * ✅ obtener director y apoyo de una carrera_periodo
 */
async function getAdmins(idCarreraPeriodo) {
  return adminRepo.getAdmins(idCarreraPeriodo);
}

/**
 * ✅ asignar director/apoyo + asegurar rol ADMIN(2)
 */
async function setAdmins(idCarreraPeriodo, payload) {
  return adminRepo.setAdmins(idCarreraPeriodo, payload);
}

module.exports = {
  resumen,
  listByPeriodo,
  bulkAssign,
  syncPeriodo,
  list,
  misActivos,
  getAdmins,
  setAdmins,
};
