// src/services/mis_calificaciones.service.js
const repo = require("../repositories/mis_calificaciones.repo");

exports.listByCP = async (cp) => {
  return repo.listByCP(cp);
};

exports.getForDocente = async (cp, idTribunalEstudiante, user) => {
  // ✅ valida pertenencia + devuelve estructura
  return repo.getForDocente(cp, idTribunalEstudiante, user.id);
};

exports.saveForDocente = async (cp, idTribunalEstudiante, user, payload) => {
  return repo.saveForDocente(cp, idTribunalEstudiante, user.id, payload);
};
