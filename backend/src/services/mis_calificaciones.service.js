// ✅ src/services/mis_calificaciones.service.js
const repo = require("../repositories/mis_calificaciones.repo");

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

async function list(cp, user) {
  // ✅ Solo ADMIN (Director / Apoyo)
  if (user?.rol !== "ADMIN") throw err("No autorizado.", 403);

  return repo.listByCP(cp);
}

module.exports = { list };
