const repo = require("../repositories/rubrica_criterio.repo");
const compRepo = require("../repositories/rubrica_componente.repo");

async function assertComponente(componenteId) {
  const c = await compRepo.findById(Number(componenteId));
  if (!c) {
    const e = new Error("Componente no existe");
    e.status = 422;
    throw e;
  }
  return c;
}

async function list(componenteId, q) {
  await assertComponente(componenteId);
  return repo.findAll({
    id_rubrica_componente: Number(componenteId),
    includeInactive: !!q.includeInactive,
  });
}

async function create(componenteId, d) {
  await assertComponente(componenteId);
  return repo.create({
    id_rubrica_componente: Number(componenteId),
    nombre_criterio: d.nombre_criterio,
    orden: Number(d.orden),
  });
}

async function update(componenteId, id, d) {
  await assertComponente(componenteId);
  await repo.mustBelongToComponente(Number(id), Number(componenteId));

  // ✅ obtener estado actual para permitir edición parcial
  const current = await repo.findById(Number(id));
  if (!current) {
    const e = new Error("Criterio no encontrado");
    e.status = 404;
    throw e;
  }

  const nextNombre =
    d.nombre_criterio !== undefined
      ? d.nombre_criterio
      : current.nombre_criterio;

  const nextOrden =
    d.orden !== undefined
      ? Number(d.orden)
      : current.orden;

  return repo.update(Number(id), {
    nombre_criterio: nextNombre,
    orden: nextOrden,
  });
}

async function changeEstado(componenteId, id, estado) {
  await assertComponente(componenteId);
  await repo.mustBelongToComponente(Number(id), Number(componenteId));
  return repo.setEstado(Number(id), estado ? 1 : 0);
}

module.exports = { list, create, update, changeEstado };
