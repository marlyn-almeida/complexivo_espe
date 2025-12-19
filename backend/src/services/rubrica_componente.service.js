const repo = require("../repositories/rubrica_componente.repo");

function validarPonderacion(p){
  const n = Number(p);
  if(!Number.isFinite(n) || n < 0 || n > 100){
    const e=new Error("ponderacion_porcentaje debe estar entre 0 y 100"); e.status=422; throw e;
  }
  return Number(n.toFixed(2));
}

async function list(q){
  return repo.findAll({
    includeInactive: q.includeInactive==="true",
    rubricaId: q.rubricaId || null
  });
}

async function get(id){
  const r=await repo.findById(id);
  if(!r){ const e=new Error("rubrica_componente no encontrado"); e.status=404; throw e; }
  return r;
}

async function create(d){
  if(!await repo.rubricaExists(d.id_rubrica)){ const e=new Error("rubrica no existe"); e.status=422; throw e; }
  if(!await repo.componenteExists(d.id_componente)){ const e=new Error("componente no existe"); e.status=422; throw e; }
  d.ponderacion_porcentaje = validarPonderacion(d.ponderacion_porcentaje);
  return repo.create(d); // respeta UNIQUE del esquema (si dup => 409 desde MySQL)
}

async function update(id, d){
  await get(id);
  d.ponderacion_porcentaje = validarPonderacion(d.ponderacion_porcentaje);
  return repo.update(id, d);
}

async function changeEstado(id, estado){ await get(id); return repo.setEstado(id, estado); }

module.exports = { list, get, create, update, changeEstado };
