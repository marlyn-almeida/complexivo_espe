// src/services/mis_calificaciones.service.js
const repo = require("../repositories/mis_calificaciones.repo");

<<<<<<< Updated upstream
exports.listByCP = async (cp) => {
  return repo.listByCP(cp);
};

exports.getForDocente = async (cp, idTribunalEstudiante, user) => {
  // ✅ valida pertenencia + devuelve estructura
  return repo.getForDocente(cp, idTribunalEstudiante, user.id);
};

exports.saveForDocente = async (cp, idTribunalEstudiante, user, payload) => {
  return repo.saveForDocente(cp, idTribunalEstudiante, user.id, payload);
=======
exports.list = async (cp, user) => {
  return repo.list(cp, user);
};

exports.getForDocente = async (cp, idTribunalEstudiante, user) => {
  // ✅ aquí debe ir tu lógica real: validar miembro, plan activo, filtrar por rol, etc
  return repo.getForDocente(cp, idTribunalEstudiante, user);
};

exports.saveForDocente = async (cp, idTribunalEstudiante, user, payload) => {
  // ✅ aquí debe ir tu lógica real: validar cerrado, allowedMap, upsert masivo, etc
  return repo.saveForDocente(cp, idTribunalEstudiante, user, payload);
>>>>>>> Stashed changes
};
