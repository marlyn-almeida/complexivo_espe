// ✅ src/services/entregas_caso.service.js
const repo = require("../repositories/entregas_caso.repo");

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

function isDocente(user) {
  return user?.rol === "DOCENTE";
}

/**
 * ✅ GET entrega por estudiante (JSON)
 * Regla:
 * - El estudiante debe estar asignado a un tribunal dentro del CP
 * - Si es DOCENTE: solo si ese docente tiene asignado al estudiante en su tribunal
 */
async function get(cp, id_estudiante, user) {
  // ✅ validar que el estudiante esté asignado a tribunal dentro del CP activo
  const ok = await repo.validateEstudianteEnTribunalCP(cp, id_estudiante);
  if (!ok) throw err("Acceso denegado: el estudiante no está asignado a un tribunal en este Carrera–Período.", 403);

  // ✅ si es DOCENTE: verificar que ese estudiante lo tenga asignado en un tribunal del docente (en ese CP)
  if (isDocente(user)) {
    const allowed = await repo.docentePuedeVerEntregaByEstudiante({
      id_docente: Number(user.id),
      id_carrera_periodo: Number(cp),
      id_estudiante: Number(id_estudiante),
    });

    if (!allowed) throw err("Acceso denegado: no tienes asignado este estudiante en tribunal.", 403);
  }

  // Puede devolver null si aún no existe entrega
  return repo.getEntregaByEstudiante(id_estudiante, { includeInactive: false });
}

/**
 * ✅ UPSERT entrega por estudiante (ADMIN)
 * Regla:
 * - Solo se permite si el estudiante está en tribunal dentro del CP
 */
async function upsert(cp, body, user) {
  const { id_estudiante } = body;

  const ok = await repo.validateEstudianteEnTribunalCP(cp, id_estudiante);
  if (!ok) throw err("No se puede subir: el estudiante no está asignado a un tribunal en este Carrera–Período.", 403);

  return repo.upsertEntregaByEstudiante(body);
}

/**
 * ✅ Download: exige que exista entrega activa con archivo
 * - Usa misma validación que get()
 */
async function getForDownload(cp, id_estudiante, user) {
  await get(cp, id_estudiante, user);

  const entrega = await repo.getEntregaByEstudiante(id_estudiante, { includeInactive: false });
  if (!entrega) throw err("Entrega no encontrada.", 404);

  if (!entrega.archivo_path) throw err("La entrega no tiene archivo PDF.", 404);

  return entrega;
}

module.exports = { get, upsert, getForDownload };
