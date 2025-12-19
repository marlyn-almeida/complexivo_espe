const repo = require("../repositories/tribunal.repo");

async function list(query={}) {
  return repo.findAll({
    includeInactive: query.includeInactive === "true",
    carreraPeriodoId: query.carreraPeriodoId || null
  });
}

async function get(id) {
  const t = await repo.findById(id);
  if (!t) { const e=new Error("Tribunal no encontrado"); e.status=404; throw e; }
  return t;
}

async function create(d) {
  const okCP = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!okCP) { const e=new Error("La relación carrera_periodo no existe"); e.status=422; throw e; }

  const cd = await repo.carreraDocenteExists(d.id_carrera_docente);
  if (!cd) { const e=new Error("La asignación carrera_docente no existe"); e.status=422; throw e; }

  // 🔥 Validación clave: carrera_docente debe pertenecer al mismo carrera_periodo
  if (+cd.id_carrera_periodo !== +d.id_carrera_periodo) {
    const e = new Error("El docente asignado no pertenece a la misma carrera_periodo del tribunal");
    e.status = 422;
    throw e;
  }

  return repo.create(d);
}

async function update(id, d) {
  await get(id);
  return create(d).then(()=>repo.update(id,d)); // reutiliza validaciones
}

async function changeEstado(id, estado) {
  await get(id);
  return repo.setEstado(id, estado);
}

module.exports = { list, get, create, update, changeEstado };
