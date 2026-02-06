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
  // 1) tribunal existe
  const t = await repo.getTribunal(d.id_tribunal);
  if (!t) throw err("Tribunal no existe", 422);

  // 2) scope (rol 2): tribunal debe ser de su carrera
  if (scope?.id_carrera) {
    const carreraIdTribunal = await repo.getTribunalCarreraId(d.id_tribunal);
    if (!carreraIdTribunal) throw err("No se pudo obtener la carrera del tribunal", 422);
    if (+carreraIdTribunal !== +scope.id_carrera) throw err("No autorizado para operar en otra carrera", 403);
  }

  // 3) estudiante existe
  const est = await repo.getEstudiante(d.id_estudiante);
  if (!est) throw err("Estudiante no existe", 422);

  // 4) franja existe (FULL para validar cruces)
  const fr = await repo.getFranjaFull(d.id_franja_horario);
  if (!fr) throw err("Franja horaria no existe", 422);

  // 5) coherencia carrera_periodo
  if (+est.id_carrera_periodo !== +t.id_carrera_periodo) {
    throw err("El estudiante no pertenece a la misma carrera_periodo del tribunal", 422);
  }
  if (+fr.id_carrera_periodo !== +t.id_carrera_periodo) {
    throw err("La franja no pertenece a la misma carrera_periodo del tribunal", 422);
  }

  // ✅ 6) el estudiante DEBE tener caso asignado (tu regla: 1 estudiante = 1 caso)
  const casoAsig = await repo.getCasoAsignadoByEstudiante(d.id_estudiante);
  if (!casoAsig || Number(casoAsig.estado_asignacion) !== 1) {
    throw err("El estudiante no tiene un caso de estudio asignado", 422);
  }
  if (+casoAsig.id_carrera_periodo !== +t.id_carrera_periodo) {
    throw err("El caso asignado no pertenece a la misma carrera_periodo del tribunal", 422);
  }

  // 7) duplicado por estudiante en el mismo tribunal
  const dup = await repo.existsAsignacion(d.id_tribunal, d.id_estudiante);
  if (dup) throw err("El estudiante ya está asignado a este tribunal", 409);

  // 8) A) bloqueo global de franja (si esa es tu regla)
  const franjaOcupada = await repo.existsFranjaOcupadaGlobal(d.id_franja_horario);
  if (franjaOcupada) {
    throw err("Esa franja ya está ocupada (laboratorio/horario reservado)", 409);
  }

  // 9) evitar que el mismo tribunal use misma franja dos veces
  const dupFranja = await repo.existsFranjaEnTribunal(d.id_tribunal, d.id_franja_horario);
  if (dupFranja) throw err("Esa franja ya está ocupada en este tribunal", 409);

  // 10) B) bloqueo por docentes del tribunal (cruce de horas)
  const docentes = await repo.getDocentesByTribunal(d.id_tribunal); // [{id_docente, designacion}]
  for (const doc of docentes) {
    const conflicto = await repo.existsConflictoHorarioDocente({
      id_docente: doc.id_docente,
      fecha: fr.fecha,
      hora_inicio: fr.hora_inicio,
      hora_fin: fr.hora_fin,
    });

    if (conflicto) {
      throw err(
        `Conflicto de agenda: el docente (${doc.designacion}) ya tiene una asignación que se cruza con esta franja`,
        409
      );
    }
  }

  // ✅ crear (SIN caso en tribunal_estudiante)
  return repo.create({
    id_tribunal: d.id_tribunal,
    id_estudiante: d.id_estudiante,
    id_franja_horario: d.id_franja_horario,
  });
}

async function changeEstado(id, estado, scope = null) {
  const r = await repo.setEstado(id, estado);
  if (!r) throw err("Asignación tribunal_estudiante no encontrada", 404);
  return r;
}

async function misAsignaciones(query = {}, user) {
  if (!isRol3(user)) throw err("Acceso denegado", 403);

  const includeInactive =
    query.includeInactive === true ||
    query.includeInactive === 1 ||
    query.includeInactive === "true";

  return repo.findMisAsignaciones({
    id_docente: Number(user.id),
    includeInactive,
  });
}

module.exports = { list, create, changeEstado, misAsignaciones };
