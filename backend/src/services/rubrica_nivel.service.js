const repo = require("../repositories/rubrica_nivel.repo");
const rubricaRepo = require("../repositories/rubrica.repo");

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
  return repo.create({
    id_rubrica: Number(rubricaId),
    nombre_nivel: d.nombre_nivel,
    valor_nivel: Number(d.valor_nivel),
    orden_nivel: Number(d.orden_nivel),
  });
}

async function update(rubricaId, id, d) {
  await assertRubrica(rubricaId);
  await repo.mustBelongToRubrica(Number(id), Number(rubricaId));
  return repo.update(Number(id), {
    nombre_nivel: d.nombre_nivel,
    valor_nivel: Number(d.valor_nivel),
    orden_nivel: Number(d.orden_nivel),
  });
}

async function changeEstado(rubricaId, id, estado) {
  await assertRubrica(rubricaId);
  await repo.mustBelongToRubrica(Number(id), Number(rubricaId));
  return repo.setEstado(Number(id), estado ? 1 : 0);
}

module.exports = { list, create, update, changeEstado };
