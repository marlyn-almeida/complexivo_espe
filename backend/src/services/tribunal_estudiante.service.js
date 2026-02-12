// ✅ src/services/tribunal_estudiante.service.js
const repo = require("../repositories/tribunal_estudiante.repo");

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

// ✅ FIX REAL: tu auth guarda rol como STRING ("DOCENTE"), no número (3)
function isRol3(user) {
  if (!user) return false;

  const role = user.rol || user.activeRole;

  // si viene string
  if (typeof role === "string") {
    return role.toUpperCase() === "DOCENTE";
  }

  // si alguna vez viene numérico
  if (typeof role === "number") {
    return role === 3;
  }

  return false;
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
  // 1) tribunal
  const t = await repo.getTribunal(d.id_tribunal);
  if (!t) throw err("Tribunal no existe", 422);

  // scope (rol2): validar carrera
  if (scope?.id_carrera) {
    const carreraIdTribunal = await repo.getTribunalCarreraId(d.id_tribunal);
    if (!carreraIdTribunal) throw err("No se pudo obtener la carrera del tribunal", 422);
    if (+carreraIdTribunal !== +scope.id_carrera) throw err("No autorizado para operar en otra carrera", 403);
  }

  // 2) estudiante
  const est = await repo.getEstudiante(d.id_estudiante);
  if (!est) throw err("Estudiante no existe", 422);

  // 3) franja
  const fr = await repo.getFranjaFull(d.id_franja_horario);
  if (!fr) throw err("Franja horaria no existe", 422);

  // 4) caso
  const caso = await repo.getCaso(d.id_caso_estudio);
  if (!caso) throw err("Caso de estudio no existe", 422);

  // 5) coherencia carrera_periodo
  if (+est.id_carrera_periodo !== +t.id_carrera_periodo) {
    throw err("El estudiante no pertenece a la misma carrera_periodo del tribunal", 422);
  }
  if (+fr.id_carrera_periodo !== +t.id_carrera_periodo) {
    throw err("La franja no pertenece a la misma carrera_periodo del tribunal", 422);
  }
  if (+caso.id_carrera_periodo !== +t.id_carrera_periodo) {
    throw err("El caso no pertenece a la misma carrera_periodo del tribunal", 422);
  }

  // 6) duplicados
  const dup = await repo.existsAsignacion(d.id_tribunal, d.id_estudiante);
  if (dup) throw err("El estudiante ya está asignado a este tribunal", 409);

  // 7) franja ocupada global
  const franjaOcupada = await repo.existsFranjaOcupadaGlobal(d.id_franja_horario);
  if (franjaOcupada) throw err("Esa franja ya está ocupada (laboratorio/horario reservado)", 409);

  // 8) franja ocupada en este tribunal
  const dupFranja = await repo.existsFranjaEnTribunal(d.id_tribunal, d.id_franja_horario);
  if (dupFranja) throw err("Esa franja ya está ocupada en este tribunal", 409);

  // 9) conflicto horario docentes
  const docentes = await repo.getDocentesByTribunal(d.id_tribunal);
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

  // 10) crear
  return repo.create({
    id_tribunal: d.id_tribunal,
    id_estudiante: d.id_estudiante,
    id_franja_horario: d.id_franja_horario,
    id_caso_estudio: d.id_caso_estudio,
  });
}

async function changeEstado(id, estado, scope = null) {
  const r = await repo.setEstado(id, estado);
  if (!r) throw err("Asignación tribunal_estudiante no encontrada", 404);
  return r;
}

async function changeCierre(id, cerrado, scope = null) {
  const te = await repo.getTribunalEstudiante(id);
  if (!te) throw err("Asignación tribunal_estudiante no encontrada", 404);

  // scope (rol2): validar carrera
  if (scope?.id_carrera) {
    const carreraId = await repo.getTribunalCarreraId(te.id_tribunal);
    if (!carreraId) throw err("No se pudo obtener la carrera del tribunal", 422);
    if (+carreraId !== +scope.id_carrera) throw err("No autorizado para operar en otra carrera", 403);
  }

  // registrar quién cierra/abre
  const id_docente = scope?.id ? Number(scope.id) : null;
  const r = await repo.setCerrado(id, !!cerrado, id_docente);
  if (!r) throw err("No se pudo actualizar cierre", 500);
  return r;
}

async function misAsignaciones(query = {}, user) {
  // ✅ aquí estaba el 403 por isRol3 mal
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

async function contextoCalificar(id_tribunal_estudiante, cpCtx, user) {
  if (!isRol3(user)) throw err("Acceso denegado", 403);

  const data = await repo.getContextoCalificar({
    id_tribunal_estudiante: Number(id_tribunal_estudiante),
    id_docente: Number(user.id),
    cpCtx: Number(cpCtx || 0),
  });

  if (!data) throw err("Asignación no encontrada o no pertenece a tu agenda.", 404);

  return { ok: true, data };
}

module.exports = { list, create, changeEstado, changeCierre, misAsignaciones, contextoCalificar };
