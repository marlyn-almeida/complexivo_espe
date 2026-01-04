const repo = require("../repositories/franja_horario.repo");

function toMinutes(hhmmss) {
  // "HH:MM" o "HH:MM:SS"
  const [h, m, s] = hhmmss.split(":").map(Number);
  return (h * 60) + (m || 0) + ((s || 0) / 60);
}

function validarHoras(hi, hf) {
  if (toMinutes(hi) >= toMinutes(hf)) {
    const e = new Error("La hora_inicio debe ser menor a hora_fin");
    e.status = 422;
    throw e;
  }
}

function enforceScopeCarreraPeriodo(scope, id_carrera_periodo) {
  // Solo aplica a Rol2 (DIRECTOR/APOYO) que trae scope.id_carrera
  if (!scope?.id_carrera) return null;
  if (!id_carrera_periodo) {
    const e = new Error("Debe seleccionar un Carrera–Período");
    e.status = 422;
    throw e;
  }
  return repo.carreraPeriodoBelongsToCarrera(id_carrera_periodo, scope.id_carrera);
}

async function list(query = {}, scope = null) {
  // ✅ aquí includeInactive ya viene boolean por express-validator
  const includeInactive = query.includeInactive === true;

  const scopeCarreraId = scope?.id_carrera ? +scope.id_carrera : null;

  return repo.findAll({
    includeInactive,
    carreraPeriodoId: query.carreraPeriodoId || null,
    fecha: query.fecha || null,
    scopeCarreraId
  });
}

async function get(id, scope = null) {
  const f = await repo.findById(id);
  if (!f) {
    const e = new Error("Franja horaria no encontrada");
    e.status = 404;
    throw e;
  }

  // ✅ si hay scope, valida que pertenece a su carrera (por su carrera_periodo)
  if (scope?.id_carrera) {
    const ok = await repo.carreraPeriodoBelongsToCarrera(f.id_carrera_periodo, scope.id_carrera);
    if (!ok) {
      const e = new Error("No autorizado para acceder a esta franja horaria");
      e.status = 403;
      throw e;
    }
  }

  return f;
}

async function create(d, scope = null) {
  validarHoras(d.hora_inicio, d.hora_fin);

  const okCP = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!okCP) {
    const e = new Error("La relación carrera_periodo no existe");
    e.status = 422;
    throw e;
  }

  // ✅ scope (Rol2)
  if (scope?.id_carrera) {
    const okScope = await repo.carreraPeriodoBelongsToCarrera(d.id_carrera_periodo, scope.id_carrera);
    if (!okScope) {
      const e = new Error("No autorizado para crear franjas en otra carrera");
      e.status = 403;
      throw e;
    }
  }

  const overlap = await repo.overlapExists(d);
  if (overlap) {
    const e = new Error("Existe cruce de horario en la misma fecha y carrera");
    e.status = 409;
    throw e;
  }

  return repo.create(d);
}

async function update(id, d, scope = null) {
  await get(id, scope); // ya valida existencia + scope
  validarHoras(d.hora_inicio, d.hora_fin);

  const okCP = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!okCP) {
    const e = new Error("La relación carrera_periodo no existe");
    e.status = 422;
    throw e;
  }

  if (scope?.id_carrera) {
    const okScope = await repo.carreraPeriodoBelongsToCarrera(d.id_carrera_periodo, scope.id_carrera);
    if (!okScope) {
      const e = new Error("No autorizado para editar franjas de otra carrera");
      e.status = 403;
      throw e;
    }
  }

  const overlap = await repo.overlapExists(d, id);
  if (overlap) {
    const e = new Error("Existe cruce de horario en la misma fecha y carrera");
    e.status = 409;
    throw e;
  }

  return repo.update(id, d);
}

async function changeEstado(id, estado, scope = null) {
  await get(id, scope); // valida scope también
  return repo.setEstado(id, estado);
}

module.exports = { list, get, create, update, changeEstado };
