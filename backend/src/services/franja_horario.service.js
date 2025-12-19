const repo = require("../repositories/franja_horario.repo");

function validarHoras(hi, hf) {
  if (hi >= hf) {
    const e = new Error("La hora_inicio debe ser menor a hora_fin");
    e.status = 422;
    throw e;
  }
}

async function list(query = {}) {
  return repo.findAll({
    includeInactive: query.includeInactive === "true",
    carreraPeriodoId: query.carreraPeriodoId || null,
    fecha: query.fecha || null
  });
}

async function get(id) {
  const f = await repo.findById(id);
  if (!f) {
    const e = new Error("Franja horaria no encontrada");
    e.status = 404;
    throw e;
  }
  return f;
}

async function create(d) {
  validarHoras(d.hora_inicio, d.hora_fin);

  const ok = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!ok) {
    const e = new Error("La relación carrera_periodo no existe");
    e.status = 422;
    throw e;
  }

  const overlap = await repo.overlapExists(d);
  if (overlap) {
    const e = new Error("Existe cruce de horario en la misma fecha y carrera");
    e.status = 409;
    throw e;
  }

  return repo.create(d);
}

async function update(id, d) {
  await get(id);
  validarHoras(d.hora_inicio, d.hora_fin);

  const ok = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!ok) {
    const e = new Error("La relación carrera_periodo no existe");
    e.status = 422;
    throw e;
  }

  const overlap = await repo.overlapExists(d, id);
  if (overlap) {
    const e = new Error("Existe cruce de horario en la misma fecha y carrera");
    e.status = 409;
    throw e;
  }

  return repo.update(id, d);
}

async function changeEstado(id, estado) {
  await get(id);
  return repo.setEstado(id, estado);
}

module.exports = { list, get, create, update, changeEstado };
