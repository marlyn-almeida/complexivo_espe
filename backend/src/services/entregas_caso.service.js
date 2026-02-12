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
 * GET entrega por estudiante
 */
async function get(cp, id_estudiante, user) {
  // 🔒 DOCENTE → exige tribunal
  if (isDocente(user)) {
    const ok = await repo.validateEstudianteEnTribunalCP(cp, id_estudiante);
    if (!ok) throw err("Acceso denegado: el estudiante no está asignado a un tribunal en este Carrera–Período.", 403);

    const allowed = await repo.docentePuedeVerEntregaByEstudiante({
      id_docente: Number(user.id),
      id_carrera_periodo: Number(cp),
      id_estudiante: Number(id_estudiante),
    });

    if (!allowed) throw err("Acceso denegado: no tienes asignado este estudiante en tribunal.", 403);

    return repo.getEntregaByEstudiante(id_estudiante, { includeInactive: false });
  }

  // ✅ ADMIN → solo validar pertenencia al CP
  const okCp = await repo.validateEstudianteEnCP(cp, id_estudiante);
  if (!okCp) throw err("Acceso denegado: el estudiante no pertenece a este Carrera–Período.", 403);

  return repo.getEntregaByEstudiante(id_estudiante, { includeInactive: false });
}

/**
 * UPSERT entrega (ADMIN)
 */
async function upsert(cp, body, user) {
  const { id_estudiante } = body;

  const okCp = await repo.validateEstudianteEnCP(cp, id_estudiante);
  if (!okCp) throw err("No se puede subir: el estudiante no pertenece a este Carrera–Período.", 403);

  return repo.upsertEntregaByEstudiante(body);
}

/**
 * Download PDF
 */
async function getForDownload(cp, id_estudiante, user) {
  await get(cp, id_estudiante, user);

  const entrega = await repo.getEntregaByEstudiante(id_estudiante, { includeInactive: false });
  if (!entrega) throw err("Entrega no encontrada.", 404);
  if (!entrega.archivo_path) throw err("La entrega no tiene archivo PDF.", 404);

  return entrega;
}

module.exports = { get, upsert, getForDownload };
