const repo = require("../repositories/criterio.repo");
async function list(q){ return repo.findAll({ includeInactive: q.includeInactive==="true" }); }
async function get(id){ const r=await repo.findById(id); if(!r){const e=new Error("Criterio no encontrado"); e.status=404; throw e;} return r; }
async function create(d){ return repo.create(d); }
async function update(id,d){ await get(id); return repo.update(id,d); }
async function changeEstado(id,estado){ await get(id); return repo.setEstado(id,estado); }
module.exports = { list, get, create, update, changeEstado };
