const repo = require("../repositories/periodo.repo");

function validarFechas(fi, ff){
  if (new Date(fi) >= new Date(ff)) {
    const e=new Error("La fecha_inicio debe ser menor a fecha_fin");
    e.status=422; throw e;
  }
}

async function list(q){ return repo.findAll(q); }

async function get(id){
  const p=await repo.findById(id);
  if(!p){ const e=new Error("Periodo no encontrado"); e.status=404; throw e; }
  return p;
}

async function create(d){
  validarFechas(d.fecha_inicio, d.fecha_fin);
  const dup=await repo.findByCodigo(d.codigo_periodo);
  if(dup){ const e=new Error("Código de periodo ya existe"); e.status=409; throw e; }
  return repo.create(d);
}

async function update(id,d){
  await get(id);
  validarFechas(d.fecha_inicio, d.fecha_fin);
  const dup=await repo.findByCodigo(d.codigo_periodo);
  if(dup && +dup.id_periodo!==+id){
    const e=new Error("Código de periodo ya existe"); e.status=409; throw e;
  }
  return repo.update(id,d);
}

async function changeEstado(id,estado){ await get(id); return repo.setEstado(id,estado); }

module.exports={ list, get, create, update, changeEstado };
