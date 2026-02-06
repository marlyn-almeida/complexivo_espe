// src/services/estudiante_caso_asignacion.service.js
const repo = require("../repositories/estudiante_caso_asignacion.repo");

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

async function list(id_carrera_periodo, includeInactive = false) {
  return repo.findAllByCP(Number(id_carrera_periodo), { includeInactive });
}

// ✅ upsert: si existe asignación del estudiante, actualiza; si no, crea
async function upsert(id_carrera_periodo, { id_estudiante, id_caso_estudio }) {
  if (!id_estudiante || !id_caso_estudio) throw err("Faltan datos de asignación", 422);

  const est = await repo.existsEstudiante(id_estudiante);
  if (!est) throw err("Estudiante no existe", 422);

  const caso = await repo.existsCaso(id_caso_estudio);
  if (!caso) throw err("Caso de estudio no existe", 422);

  // ✅ Seguridad por CP (además del trigger)
  if (Number(est.id_carrera_periodo) !== Number(id_carrera_periodo)) {
    throw err("Estudiante fuera de tu carrera–período", 403);
  }
  if (Number(caso.id_carrera_periodo) !== Number(id_carrera_periodo)) {
    throw err("Caso fuera de tu carrera–período", 403);
  }

  const existing = await repo.findByEstudiante(id_estudiante);
  if (!existing) {
    // si no existe, crea (UNIQUE id_estudiante lo garantiza)
    return repo.create({ id_estudiante, id_caso_estudio });
  }

  // si existe, actualiza caso (mantiene 1 caso por estudiante)
  return repo.updateByEstudiante(id_estudiante, { id_caso_estudio });
}

async function changeEstado(id_carrera_periodo, id_estudiante, estado) {
  const existing = await repo.findByEstudiante(id_estudiante);
  if (!existing) throw err("Asignación estudiante–caso no encontrada", 404);

  const est = await repo.existsEstudiante(id_estudiante);
  if (!est) throw err("Estudiante no existe", 422);

  if (Number(est.id_carrera_periodo) !== Number(id_carrera_periodo)) {
    throw err("Estudiante fuera de tu carrera–período", 403);
  }

  return repo.setEstadoByEstudiante(id_estudiante, estado);
}

module.exports = { list, upsert, changeEstado };
