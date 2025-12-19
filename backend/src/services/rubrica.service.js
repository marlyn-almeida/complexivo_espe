const repo = require("../repositories/rubrica.repo");

async function list(q){
  return repo.findAll({
    includeInactive: q.includeInactive === "true",
    carreraPeriodoId: q.carreraPeriodoId || null
  });
}

async function get(id){
  const r = await repo.findById(id);
  if(!r){ const e=new Error("Rúbrica no encontrada"); e.status=404; throw e; }
  return r;
}

async function create(d){
  const ok = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if(!ok){ const e=new Error("carrera_periodo no existe"); e.status=422; throw e; }
  return repo.create(d);
}

async function update(id, d){
  await get(id);
  return create(d).then(()=>repo.update(id,d));
}

async function changeEstado(id, estado){
  await get(id);
  return repo.setEstado(id, estado);
}

module.exports = { list, get, create, update, changeEstado };
