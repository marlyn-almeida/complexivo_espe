// ✅ src/services/mis_calificaciones.service.js
const repo = require("../repositories/mis_calificaciones.repo");

/**
 * ✅ ADMIN
 * Devuelve data + resumen (para los cuadros)
 */
async function listByCP(cp) {
  const rows = await repo.listByCP(cp);

  // ✅ contadores para UI
  const total = rows.length;
  const entregados = rows.filter((r) => r.estado_entrega === "ENTREGADO").length;
  const pendientes = rows.filter((r) => r.estado_entrega === "PENDIENTE").length;

  return {
    data: rows,
    resumen: { total, entregados, pendientes },
  };
}

/**
 * ✅ DOCENTE
 * user = req.user (trae id_docente del token)
 */
async function getForDocente(idTribunalEstudiante, user) {
  const idDocente = Number(user?.id || 0);
  if (!idDocente) {
    const err = new Error("Token inválido");
    err.status = 401;
    throw err;
  }
  return repo.getForDocente(idTribunalEstudiante, idDocente);
}

/**
 * ✅ DOCENTE
 */
async function saveForDocente(idTribunalEstudiante, user, payload) {
  const idDocente = Number(user?.id || 0);
  if (!idDocente) {
    const err = new Error("Token inválido");
    err.status = 401;
    throw err;
  }
  return repo.saveForDocente(idTribunalEstudiante, idDocente, payload);
}

module.exports = {
  listByCP,
  getForDocente,
  saveForDocente,
};
