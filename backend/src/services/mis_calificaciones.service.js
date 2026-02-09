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
 * user = req.user (trae id del usuario logeado)
 */
async function getForDocente(cp, idTribunalEstudiante, user) {
  const idUsuario = Number(user?.id || 0);
  if (!idUsuario) {
    const err = new Error("Token inválido");
    err.status = 401;
    throw err;
  }
  return repo.getForDocente(cp, idTribunalEstudiante, idUsuario);
}

/**
 * ✅ DOCENTE
 */
async function saveForDocente(cp, idTribunalEstudiante, user, payload) {
  const idUsuario = Number(user?.id || 0);
  if (!idUsuario) {
    const err = new Error("Token inválido");
    err.status = 401;
    throw err;
  }
  return repo.saveForDocente(cp, idTribunalEstudiante, idUsuario, payload);
}

module.exports = {
  listByCP,
  getForDocente,
  saveForDocente,
};
