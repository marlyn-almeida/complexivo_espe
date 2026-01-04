// src/services/tribunal_estudiante.service.js
const repo = require("../repositories/tribunal_estudiante.repo");

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

function isRol3(user) {
  return Number(user?.rol) === 3;
}

async function list(query = {}, scope = null) {
  const includeInactive =
    query.includeInactive === true ||
    query.includeInactive === 1 ||
    query.includeInactive === "true";

  const scopeCarreraId = scope?.id_carrera ? +scope.id_carrera : null;

  return repo.findAll({
    tribunalId: query.tribunalId || null,
    includeInactive,
    scopeCarreraId,
  });
}

async function create(d, scope = null) {
  const t = await repo.getTribunal(d.id_tribunal);
  if (!t) throw err("Tribunal no existe", 422);

  // ✅ scope (rol 2): el tribunal debe ser de su carrera
  if (scope?.id_carrera) {
    const carreraIdTribunal = await repo.getTribunalCarreraId(d.id_tribunal);
    if (!carreraIdTribunal) throw err("No se pudo obtener la carrera del tribunal", 422);
    if (+carreraIdTribunal !== +scope.id_carrera) throw err("No autorizado para operar en otra carrera", 403);
  }

  const est = await repo.getEstudiante(d.id_estudiante);
  if (!est) throw err("Estudiante no existe", 422);

  const fr = await repo.getFranja(d.id_franja_horario);
  if (!fr) throw err("Franja horaria no existe", 422);

  // coherencia carrera_periodo
  if (+est.id_carrera_periodo !== +t.id_carrera_periodo) {
    throw err("El estudiante no pertenece a la misma carrera_periodo del tribunal", 422);
  }
  if (+fr.id_carrera_periodo !== +t.id_carrera_periodo) {
    throw err("La franja no pertenece a la misma carrera_periodo del tribunal", 422);
  }

  // duplicado por estudiante
  const dup = await repo.existsAsignacion(d.id_tribunal, d.id_estudiante);
  if (dup) throw err("El estudiante ya está asignado a este tribunal", 409);

  // ✅ nuevo: duplicado por franja dentro del mismo tribunal (agenda)
  const dupFranja = await repo.existsFranjaEnTribunal(d.id_tribunal, d.id_franja_horario);
  if (dupFranja) throw err("Esa franja ya está ocupada en este tribunal", 409);

  return repo.create(d);
}

async function changeEstado(id, estado, scope = null) {
  const r = await repo.setEstado(id, estado);
  if (!r) throw err("Asignación tribunal_estudiante no encontrada", 404);
  return r;
}

// ✅ NUEVO: Mis asignaciones (ROL 3)
async function misAsignaciones(query = {}, user) {
  if (!isRol3(user)) throw err("Acceso denegado", 403);

  const includeInactive =
    query.includeInactive === true ||
    query.includeInactive === 1 ||
    query.includeInactive === "true";

  // En tu JWT: req.user.id = id_docente
  return repo.findMisAsignaciones({
    id_docente: Number(user.id),
    includeInactive,
  });
}

module.exports = { list, create, changeEstado, misAsignaciones };
