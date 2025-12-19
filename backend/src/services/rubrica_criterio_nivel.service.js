const repo = require("../repositories/rubrica_criterio_nivel.repo");

async function list(q){
  return repo.findAll({
    includeInactive: q.includeInactive==="true",
    componenteId: q.componenteId || null
  });
}

async function get(id){
  const r=await repo.findById(id);
  if(!r){ const e=new Error("rubrica_criterio_nivel no encontrado"); e.status=404; throw e; }
  return r;
}

async function create(d){
  if(!await repo.componenteExists(d.id_componente)){ const e=new Error("componente no existe"); e.status=422; throw e; }
  if(!await repo.criterioExists(d.id_criterio)){ const e=new Error("criterio no existe"); e.status=422; throw e; }
  if(!await repo.nivelExists(d.id_nivel)){ const e=new Error("nivel no existe"); e.status=422; throw e; }
  if(!d.descripcion || !String(d.descripcion).trim()){ const e=new Error("descripcion es obligatoria"); e.status=422; throw e; }
  return repo.create(d); // UNIQUE triple lo asegura la BD
}

async function update(id, d){
  await get(id);
  if(!d.descripcion || !String(d.descripcion).trim()){ const e=new Error("descripcion es obligatoria"); e.status=422; throw e; }
  return repo.update(id, d);
}

async function changeEstado(id, estado){ await get(id); return repo.setEstado(id, estado); }

module.exports = { list, get, create, update, changeEstado };
