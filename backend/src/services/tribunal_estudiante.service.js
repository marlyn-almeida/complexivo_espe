const repo = require("../repositories/tribunal_estudiante.repo");

async function list(query={}) {
  return repo.findAll({
    tribunalId: query.tribunalId || null,
    includeInactive: query.includeInactive === "true"
  });
}

async function create(d){
  const t = await repo.getTribunal(d.id_tribunal);
  if (!t){ const e=new Error("Tribunal no existe"); e.status=422; throw e; }

  const est = await repo.getEstudiante(d.id_estudiante);
  if (!est){ const e=new Error("Estudiante no existe"); e.status=422; throw e; }

  const fr = await repo.getFranja(d.id_franja_horario);
  if (!fr){ const e=new Error("Franja horaria no existe"); e.status=422; throw e; }

  // coherencia carrera_periodo
  if (+est.id_carrera_periodo !== +t.id_carrera_periodo){
    const e=new Error("El estudiante no pertenece a la misma carrera_periodo del tribunal");
    e.status=422; throw e;
  }
  if (+fr.id_carrera_periodo !== +t.id_carrera_periodo){
    const e=new Error("La franja no pertenece a la misma carrera_periodo del tribunal");
    e.status=422; throw e;
  }

  const dup = await repo.existsAsignacion(d.id_tribunal, d.id_estudiante);
  if (dup){ const e=new Error("El estudiante ya está asignado a este tribunal"); e.status=409; throw e; }

  return repo.create(d);
}

async function changeEstado(id, estado){
  const r = await repo.setEstado(id, estado);
  if (!r){ const e=new Error("Asignación tribunal_estudiante no encontrada"); e.status=404; throw e; }
  return r;
}

module.exports = { list, create, changeEstado };
