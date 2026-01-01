// src/services/carrera_admin.service.js
const repo = require("../repositories/carrera_admin.repo");

async function getAdmins(idCarrera) {
  return repo.getAdmins(idCarrera);
}

async function setAdmins(idCarrera, payload) {
  return repo.setAdmins(idCarrera, payload);
}

module.exports = { getAdmins, setAdmins };
