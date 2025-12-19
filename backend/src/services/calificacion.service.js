const repo = require("../repositories/calificacion.repo");

const TIPOS_OK = new Set(["TEORICO","PRACTICO_ESCRITA","PRACTICO_ORAL","FINAL"]);

function validarNota(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0 || num > 20) {
    const e = new Error("nota_base20 debe estar entre 0 y 20");
    e.status = 422; throw e;
  }
  return Number(num.toFixed(2));
}

async function validarCoherencia(id_tribunal_estudiante, id_rubrica) {
  const te = await repo.getTribunalEstudiante(id_tribunal_estudiante);
  if (!te) { const e=new Error("tribunal_estudiante no existe"); e.status=422; throw e; }

  const r = await repo.getRubrica(id_rubrica);
  if (!r) { const e=new Error("rubrica no existe"); e.status=422; throw e; }

  if (+te.id_carrera_periodo !== +r.id_carrera_periodo) {
    const e=new Error("La rúbrica no pertenece al mismo carrera_periodo del tribunal_estudiante");
    e.status=422; throw e;
  }
}

async function list(q){ 
  return repo.findAll({
    includeInactive: q.includeInactive === "true",
    tribunalEstudianteId: q.tribunalEstudianteId || null,
    rubricaId: q.rubricaId || null
  });
}

async function get(id){
  const c = await repo.findById(id);
  if(!c){ const e=new Error("Calificación no encontrada"); e.status=404; throw e; }
  return c;
}

async function create(d){
  if (!TIPOS_OK.has(d.tipo_rubrica)) {
    const e=new Error("tipo_rubrica inválido"); e.status=422; throw e;
  }
  await validarCoherencia(d.id_tribunal_estudiante, d.id_rubrica);
  d.nota_base20 = validarNota(d.nota_base20);

  // respeta UNIQUE (id_tribunal_estudiante, id_rubrica, tipo_rubrica)
  const dup = await repo.findOneByKey(d.id_tribunal_estudiante, d.id_rubrica, d.tipo_rubrica);
  if (dup) { const e=new Error("Ya existe calificación para ese tipo"); e.status=409; throw e; }

  return repo.create(d);
}

async function update(id, d){
  const existing = await get(id);
  if (!TIPOS_OK.has(d.tipo_rubrica)) {
    const e=new Error("tipo_rubrica inválido"); e.status=422; throw e;
  }
  await validarCoherencia(existing.id_tribunal_estudiante, existing.id_rubrica);
  d.nota_base20 = validarNota(d.nota_base20);
  return repo.update(id, d);
}

async function changeEstado(id, estado){ await get(id); return repo.setEstado(id, estado); }

module.exports = { list, get, create, update, changeEstado, validarNota, validarCoherencia, TIPOS_OK };
