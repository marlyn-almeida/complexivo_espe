const repo = require("../repositories/carrera_docente.repo");

function isRol2(user) {
  return Number(user?.rol) === 2;
}

async function list(query = {}, user) {
  const includeInactive = query.includeInactive === "true";

  // ✅ ahora filtramos por carreraId (porque carrera_docente usa id_carrera)
  let carreraId = query.carreraId || null;
  const docenteId = query.docenteId || null;

  // ✅ scope rol 2: forzar su carrera
  if (isRol2(user)) {
    carreraId = user?.scope?.id_carrera || null;
  }

  return repo.findAll({
    includeInactive,
    docenteId,
    carreraId,
  });
}

async function create(payload, user) {
  const okDoc = await repo.docenteExists(payload.id_docente);
  if (!okDoc) {
    const e = new Error("El docente no existe");
    e.status = 422;
    throw e;
  }

  const okCarrera = await repo.carreraExists(payload.id_carrera);
  if (!okCarrera) {
    const e = new Error("La carrera no existe");
    e.status = 422;
    throw e;
  }

  // ✅ scope rol 2: solo puede asignar en SU carrera
  if (isRol2(user)) {
    const scopeCarreraId = Number(user?.scope?.id_carrera || 0);
    if (Number(payload.id_carrera) !== scopeCarreraId) {
      const e = new Error("Acceso denegado: solo puedes asignar docentes en tu carrera");
      e.status = 403;
      throw e;
    }
  }

  const tipo_admin = payload.tipo_admin || "DOCENTE";

  const dup = await repo.exists(payload.id_docente, payload.id_carrera, tipo_admin);
  if (dup) {
    const e = new Error("El docente ya está asignado a esa carrera con ese tipo_admin");
    e.status = 409;
    throw e;
  }

  return repo.create({
    id_docente: payload.id_docente,
    id_carrera: payload.id_carrera,
    tipo_admin,
  });
}

async function changeEstado(id, estado, user) {
  const row = await repo.findById(id);
  if (!row) {
    const e = new Error("Asignación carrera_docente no encontrada");
    e.status = 404;
    throw e;
  }

  // ✅ scope rol 2: no puede tocar asignaciones de otra carrera
  if (isRol2(user)) {
    const scopeCarreraId = Number(user?.scope?.id_carrera || 0);
    if (Number(row.id_carrera) !== scopeCarreraId) {
      const e = new Error("Acceso denegado: no puedes modificar asignaciones de otra carrera");
      e.status = 403;
      throw e;
    }
  }

  return repo.setEstado(id, estado);
}

module.exports = { list, create, changeEstado };
