// src/services/estudiante.service.js
const repo = require("../repositories/estudiante.repo");

function isRol2(user) {
  return Number(user?.rol) === 2;
}

async function list(query = {}, user) {
  const includeInactive = Boolean(query.includeInactive);
  const q = query.q || "";
  const page = query.page || 1;
  const limit = query.limit || 50;
  const carreraPeriodoId = query.carreraPeriodoId || null;

  const scopeCarreraId = isRol2(user) ? user?.scope?.id_carrera : null;

  return repo.findAll({
    includeInactive,
    q,
    page,
    limit,
    carreraPeriodoId,
    scopeCarreraId,
  });
}

async function get(id, user) {
  const e = await repo.findById(id);
  if (!e) {
    const err = new Error("Estudiante no encontrado");
    err.status = 404;
    throw err;
  }

  // ✅ scope rol 2 (carrera)
  if (isRol2(user)) {
    const okScope = await repo.carreraPeriodoBelongsToCarrera(
      e.id_carrera_periodo,
      user.scope.id_carrera
    );
    if (!okScope) {
      const err = new Error("Acceso denegado: estudiante fuera de tu carrera");
      err.status = 403;
      throw err;
    }
  }

  return e;
}

async function create(payload, user) {
  const ok = await repo.carreraPeriodoExists(payload.id_carrera_periodo);
  if (!ok) {
    const err = new Error("La relación carrera_periodo no existe");
    err.status = 422;
    throw err;
  }

  // ✅ scope rol 2 (carrera)
  if (isRol2(user)) {
    const okScope = await repo.carreraPeriodoBelongsToCarrera(
      payload.id_carrera_periodo,
      user.scope.id_carrera
    );
    if (!okScope) {
      const err = new Error("Acceso denegado: carrera_periodo no pertenece a tu carrera");
      err.status = 403;
      throw err;
    }
  }

  // ✅ duplicado por carrera_periodo (institucional)
  const dupInst = await repo.findByInstitucionalInCarreraPeriodo(
    payload.id_carrera_periodo,
    payload.id_institucional_estudiante
  );
  if (dupInst) {
    const err = new Error("Ya existe un estudiante con ese ID institucional en esta carrera/periodo");
    err.status = 409;
    throw err;
  }

  // ✅ duplicado por carrera_periodo (cedula)
  const dupCed = await repo.findByCedulaInCarreraPeriodo(payload.id_carrera_periodo, payload.cedula);
  if (dupCed) {
    const err = new Error("Ya existe un estudiante con esa cédula en esta carrera/periodo");
    err.status = 409;
    throw err;
  }

  // ✅ duplicado por carrera_periodo (username)
  const dupUser = await repo.findByUsernameInCarreraPeriodo(
    payload.id_carrera_periodo,
    payload.nombre_usuario
  );
  if (dupUser) {
    const err = new Error("Ya existe un estudiante con ese nombre de usuario en esta carrera/periodo");
    err.status = 409;
    throw err;
  }

  return repo.create(payload);
}

async function update(id, payload, user) {
  await get(id, user);

  const ok = await repo.carreraPeriodoExists(payload.id_carrera_periodo);
  if (!ok) {
    const err = new Error("La relación carrera_periodo no existe");
    err.status = 422;
    throw err;
  }

  // ✅ scope rol 2 (carrera)
  if (isRol2(user)) {
    const okScope = await repo.carreraPeriodoBelongsToCarrera(
      payload.id_carrera_periodo,
      user.scope.id_carrera
    );
    if (!okScope) {
      const err = new Error("Acceso denegado: carrera_periodo no pertenece a tu carrera");
      err.status = 403;
      throw err;
    }
  }

  // ✅ duplicado institucional por cp (excluyendo el mismo id)
  const dupInst = await repo.findByInstitucionalInCarreraPeriodo(
    payload.id_carrera_periodo,
    payload.id_institucional_estudiante
  );
  if (dupInst && Number(dupInst.id_estudiante) !== Number(id)) {
    const err = new Error("Ya existe un estudiante con ese ID institucional en esta carrera/periodo");
    err.status = 409;
    throw err;
  }

  // ✅ duplicado cedula por cp (excluyendo el mismo id)
  const dupCed = await repo.findByCedulaInCarreraPeriodo(payload.id_carrera_periodo, payload.cedula);
  if (dupCed && Number(dupCed.id_estudiante) !== Number(id)) {
    const err = new Error("Ya existe un estudiante con esa cédula en esta carrera/periodo");
    err.status = 409;
    throw err;
  }

  // ✅ duplicado username por cp (excluyendo el mismo id)
  const dupUser = await repo.findByUsernameInCarreraPeriodo(
    payload.id_carrera_periodo,
    payload.nombre_usuario
  );
  if (dupUser && Number(dupUser.id_estudiante) !== Number(id)) {
    const err = new Error("Ya existe un estudiante con ese nombre de usuario en esta carrera/periodo");
    err.status = 409;
    throw err;
  }

  return repo.update(id, payload);
}

async function changeEstado(id, estado, user) {
  await get(id, user);
  return repo.setEstado(id, estado);
}

// ✅ NUEVO: Asignaciones del estudiante (para EstudianteAsignacionesPage)
async function asignaciones(id, user, ctx) {
  const estudiante = await repo.findById(id);
  if (!estudiante) {
    const err = new Error("Estudiante no encontrado");
    err.status = 404;
    throw err;
  }

  // ✅ ROL 2: validación estricta por contexto carrera-periodo (NO solo carrera)
  if (isRol2(user)) {
    const ctxCp = Number(ctx?.id_carrera_periodo || 0);
    if (!ctxCp) {
      const err = new Error("Contexto inválido: carrera_periodo no definido para este usuario");
      err.status = 403;
      throw err;
    }

    if (Number(estudiante.id_carrera_periodo) !== ctxCp) {
      const err = new Error("Acceso denegado: estudiante fuera de tu carrera-período");
      err.status = 403;
      throw err;
    }
  }

  const idCarreraPeriodo = isRol2(user)
    ? Number(ctx.id_carrera_periodo)
    : Number(estudiante.id_carrera_periodo);

  const nota = await repo.findNotaTeoricoByEstudianteCp(Number(id), idCarreraPeriodo);
  const caso = await repo.findCasoAsignadoByEstudianteCp(Number(id), idCarreraPeriodo);

  const entrega = caso?.id_caso_estudio
    ? await repo.findEntregaByEstudianteCaso(Number(id), Number(caso.id_caso_estudio))
    : null;

  return {
    estudiante: {
      id_estudiante: estudiante.id_estudiante,
      id_carrera_periodo: estudiante.id_carrera_periodo,
      id_institucional_estudiante: estudiante.id_institucional_estudiante,
      nombre_usuario: estudiante.nombre_usuario,
      cedula: estudiante.cedula,
      nombres_estudiante: estudiante.nombres_estudiante,
      apellidos_estudiante: estudiante.apellidos_estudiante,
      estado: estudiante.estado,
    },
    nota_teorico: nota || null,
    caso: caso || null,
    entrega: entrega || null,
  };
}

module.exports = { list, get, create, update, changeEstado, asignaciones };
