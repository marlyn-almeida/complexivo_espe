const repo = require("../repositories/rubrica_criterio_nivel.repo");
const criterioRepo = require("../repositories/rubrica_criterio.repo");
const nivelRepo = require("../repositories/rubrica_nivel.repo");

async function assertCriterio(criterioId) {
  const c = await criterioRepo.findById(Number(criterioId));
  if (!c) {
    const e = new Error("Criterio no existe");
    e.status = 422;
    throw e;
  }
  return c;
}

async function list(criterioId, q) {
  await assertCriterio(criterioId);
  return repo.findAll({
    id_rubrica_criterio: Number(criterioId),
    includeInactive: !!q.includeInactive,
  });
}

async function upsert(criterioId, d) {
  await assertCriterio(criterioId);

  const nivel = await nivelRepo.findById(Number(d.id_rubrica_nivel));
  if (!nivel) {
    const e = new Error("Nivel no existe");
    e.status = 422;
    throw e;
  }

  // validar que el nivel pertenezca a la misma rúbrica del criterio
  const ok = await repo.nivelPerteneceALaRubricaDelCriterio(
    Number(criterioId),
    Number(d.id_rubrica_nivel)
  );
  if (!ok) {
    const e = new Error("El nivel no pertenece a la misma rúbrica del criterio");
    e.status = 409;
    throw e;
  }

  // ✅ permitir descripción vacía (editor)
  const descripcion =
    d.descripcion !== undefined ? String(d.descripcion).trim() : "";

  return repo.upsert({
    id_rubrica_criterio: Number(criterioId),
    id_rubrica_nivel: Number(d.id_rubrica_nivel),
    descripcion,
  });
}

async function changeEstado(criterioId, id, estado) {
  await assertCriterio(criterioId);
  await repo.mustBelongToCriterio(Number(id), Number(criterioId));
  return repo.setEstado(Number(id), estado ? 1 : 0);
}

module.exports = { list, upsert, changeEstado };
