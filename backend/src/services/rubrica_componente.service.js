const repo = require("../repositories/rubrica_componente.repo");
const rubricaRepo = require("../repositories/rubrica.repo");

function validarPonderacion(p) {
  const n = Number(p);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    const e = new Error("ponderacion debe estar entre 0 y 100");
    e.status = 422;
    throw e;
  }
  return Number(n.toFixed(2));
}

async function assertRubrica(rubricaId) {
  const r = await rubricaRepo.findById(Number(rubricaId));
  if (!r) {
    const e = new Error("Rúbrica no existe");
    e.status = 422;
    throw e;
  }
}

async function list(rubricaId, q) {
  await assertRubrica(rubricaId);
  return repo.findAll({
    id_rubrica: Number(rubricaId),
    includeInactive: !!q.includeInactive,
  });
}

async function create(rubricaId, d) {
  await assertRubrica(rubricaId);

  // ✅ si no envían ponderación, por defecto 0 (editable luego)
  const ponderacion = d.ponderacion === undefined ? 0 : validarPonderacion(d.ponderacion);

  // ✅ orden obligatorio en create; si no viene, caería en la validación de routes
  return repo.create({
    id_rubrica: Number(rubricaId),
    nombre_componente: d.nombre_componente,
    tipo_componente: d.tipo_componente || "OTRO",
    ponderacion,
    orden: Number(d.orden),
  });
}

async function update(rubricaId, id, d) {
  await assertRubrica(rubricaId);
  await repo.mustBelongToRubrica(Number(id), Number(rubricaId));

  // ✅ traer el componente actual para permitir update parcial
  const current = await repo.findById(Number(id));
  if (!current) {
    const e = new Error("Componente no encontrado");
    e.status = 404;
    throw e;
  }

  const nextNombre = d.nombre_componente !== undefined ? d.nombre_componente : current.nombre_componente;
  const nextTipo = d.tipo_componente !== undefined ? d.tipo_componente : current.tipo_componente;
  const nextOrden = d.orden !== undefined ? Number(d.orden) : current.orden;

  const nextPonderacion =
    d.ponderacion !== undefined ? validarPonderacion(d.ponderacion) : current.ponderacion;

  return repo.update(Number(id), {
    nombre_componente: nextNombre,
    tipo_componente: nextTipo || "OTRO",
    ponderacion: nextPonderacion,
    orden: nextOrden,
  });
}

async function changeEstado(rubricaId, id, estado) {
  await assertRubrica(rubricaId);
  await repo.mustBelongToRubrica(Number(id), Number(rubricaId));
  return repo.setEstado(Number(id), estado ? 1 : 0);
}

module.exports = { list, create, update, changeEstado };
