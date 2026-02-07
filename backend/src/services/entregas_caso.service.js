// src/services/entregas_caso.service.js
const repo = require("../repositories/entregas_caso.repo");

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

function isDocente(user) {
  return user?.rol === "DOCENTE";
}

async function get(cp, id_estudiante, id_caso_estudio, user) {
  // ✅ seguridad base: validar que estudiante y caso pertenezcan a ese CP
  const ok = await repo.validateEntregaScope(cp, id_estudiante, id_caso_estudio);
  if (!ok) throw err("Entrega fuera de tu carrera-período (estudiante/caso no corresponden)", 403);

  // ✅ si es DOCENTE: verificar que ese estudiante lo tenga asignado en un tribunal del docente
  if (isDocente(user)) {
    const allowed = await repo.docentePuedeVerEntrega({
      id_docente: Number(user.id),
      id_estudiante,
      id_caso_estudio,
    });

    if (!allowed) throw err("Acceso denegado: no tienes asignado este estudiante en tribunal.", 403);
  }

  // Puede devolver null si aún no entrega
  return repo.getEntrega(id_estudiante, id_caso_estudio, { includeInactive: false });
}

async function upsert(cp, body, user) {
  // solo ADMIN sube (ya lo controla route), pero igual dejamos coherencia
  const { id_estudiante, id_caso_estudio } = body;

  const ok = await repo.validateEntregaScope(cp, id_estudiante, id_caso_estudio);
  if (!ok) throw err("Entrega fuera de tu carrera-período (estudiante/caso no corresponden)", 403);

  return repo.upsertEntrega(body);
}

// ✅ download usa lo mismo que get, pero exige que exista entrega activa con archivo
async function getForDownload(cp, id_estudiante, id_caso_estudio, user) {
  // valida scope + permiso docente
  await get(cp, id_estudiante, id_caso_estudio, user);

  const entrega = await repo.getEntrega(id_estudiante, id_caso_estudio, { includeInactive: false });
  if (!entrega) throw err("Entrega no encontrada.", 404);

  return entrega;
}

module.exports = { get, upsert, getForDownload };
