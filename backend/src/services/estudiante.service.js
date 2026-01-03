const repo = require("../repositories/estudiante.repo");

function isRol2(user) {
  return Number(user?.rol) === 2;
}

async function list(query = {}, user) {
  const includeInactive = query.includeInactive === "true";
  const q = query.q || "";
  const page = query.page || 1;
  const limit = query.limit || 50;
  const carreraPeriodoId = query.carreraPeriodoId || null;

  // ✅ scope rol 2
  const scopeCarreraId = isRol2(user) ? user?.scope?.id_carrera : null;

  return repo.findAll({ includeInactive, q, page, limit, carreraPeriodoId, scopeCarreraId });
}

async function get(id, user) {
  const e = await repo.findById(id);
  if (!e) {
    const err = new Error("Estudiante no encontrado");
    err.status = 404;
    throw err;
  }

  // ✅ si rol 2, validar que ese estudiante pertenece a su carrera
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

  // ✅ si rol 2, el cp debe pertenecer a su carrera
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

  const dup = await repo.findByInstitucional(payload.id_institucional_estudiante);
  if (dup) {
    const err = new Error("Ya existe un estudiante con ese ID institucional");
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

  // ✅ si rol 2, el nuevo cp también debe pertenecer a su carrera
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

  const dup = await repo.findByInstitucional(payload.id_institucional_estudiante);
  if (dup && Number(dup.id_estudiante) !== Number(id)) {
    const err = new Error("Ya existe un estudiante con ese ID institucional");
    err.status = 409;
    throw err;
  }

  return repo.update(id, payload);
}

async function changeEstado(id, estado, user) {
  await get(id, user);
  return repo.setEstado(id, estado);
}

module.exports = { list, get, create, update, changeEstado };
