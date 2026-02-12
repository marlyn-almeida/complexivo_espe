// ✅ src/services/mis_calificaciones.service.js
const repo = require("../repositories/mis_calificaciones.repo");

/**
 * ✅ ADMIN
 */
async function listByCP(cp) {
  return repo.listByCP(cp);
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
