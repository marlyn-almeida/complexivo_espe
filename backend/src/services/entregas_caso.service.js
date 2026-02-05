// src/services/entregas_caso.service.js
const repo = require("../repositories/entregas_caso.repo");

async function get(cp, id_estudiante, id_caso_estudio) {
  // Puede devolver null sin problema
  return repo.getEntrega(id_estudiante, id_caso_estudio);
}

async function upsert(cp, body) {
  const { id_estudiante, id_caso_estudio } = body;

  const ok = await repo.validateEntregaScope(cp, id_estudiante, id_caso_estudio);
  if (!ok) {
    const e = new Error("Entrega fuera de tu carrera-período (estudiante/caso no corresponden)");
    e.status = 403;
    throw e;
  }

  // ✅ repo devuelve el registro
  return repo.upsertEntrega(body);
}

module.exports = { get, upsert };
