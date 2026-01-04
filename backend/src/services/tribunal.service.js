const repo = require("../repositories/tribunal.repo");

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

async function list(query = {}, scope = null) {
  // ✅ tu route convierte includeInactive a boolean
  const includeInactive = query.includeInactive === true;
  const scopeCarreraId = scope?.id_carrera ? +scope.id_carrera : null;

  return repo.findAll({
    includeInactive,
    carreraPeriodoId: query.carreraPeriodoId || null,
    scopeCarreraId,
  });
}

async function get(id, scope = null) {
  const t = await repo.findById(id);
  if (!t) throw err("Tribunal no encontrado", 404);

  // ✅ scope: que el tribunal pertenezca a su carrera
  if (scope?.id_carrera) {
    const carreraId = await repo.getCarreraIdByCarreraPeriodo(t.id_carrera_periodo);
    if (+carreraId !== +scope.id_carrera) throw err("No autorizado para acceder a este tribunal", 403);
  }

  // devolvemos también docentes del tribunal
  const docentes = await repo.findDocentesByTribunal(id);
  return { ...t, docentes };
}

function validarDocentes(docentes) {
  if (!docentes) throw err("Debe enviar docentes del tribunal", 422);

  const presidente = +docentes.presidente;
  const integrante1 = +docentes.integrante1;
  const integrante2 = +docentes.integrante2;

  if (!presidente || !integrante1 || !integrante2) {
    throw err("Debe seleccionar Presidente, Integrante 1 e Integrante 2", 422);
  }

  const set = new Set([presidente, integrante1, integrante2]);
  if (set.size !== 3) throw err("Los docentes del tribunal no pueden repetirse", 422);

  return { presidente, integrante1, integrante2 };
}

async function validarCoherenciaCarrera(d, scope) {
  const okCP = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!okCP) throw err("La relación carrera_periodo no existe", 422);

  const carreraIdCP = await repo.getCarreraIdByCarreraPeriodo(d.id_carrera_periodo);
  if (!carreraIdCP) throw err("No se pudo obtener la carrera del carrera_periodo", 422);

  // ✅ scope (Rol 2): solo su carrera
  if (scope?.id_carrera && +scope.id_carrera !== +carreraIdCP) {
    throw err("No autorizado para operar en otra carrera", 403);
  }

  const docentes = validarDocentes(d.docentes);

  // valida que cada carrera_docente pertenezca a la MISMA carrera
  for (const id_cd of [docentes.presidente, docentes.integrante1, docentes.integrante2]) {
    const cd = await repo.getCarreraIdByCarreraDocente(id_cd);
    if (!cd) throw err("La asignación carrera_docente no existe", 422);
    if (+cd.id_carrera !== +carreraIdCP) {
      throw err("Un docente seleccionado no pertenece a la misma carrera del Carrera–Período", 422);
    }
  }

  return { carreraIdCP, docentes };
}

async function create(d, scope = null) {
  if (!d.nombre_tribunal || !String(d.nombre_tribunal).trim()) {
    throw err("nombre_tribunal es requerido", 422);
  }

  // caso opcional: si viene, validamos que sea int>=1 (la ruta también puede hacerlo)
  if (d.caso != null && d.caso !== "") {
    const c = +d.caso;
    if (!Number.isInteger(c) || c < 1) throw err("caso debe ser entero >= 1", 422);
    d.caso = c;
  } else {
    delete d.caso; // para que repo lo autogenere
  }

  const { docentes } = await validarCoherenciaCarrera(d, scope);

  // ✅ mantenemos tribunal.id_carrera_docente = PRESIDENTE (responsable)
  const payload = {
    id_carrera_periodo: +d.id_carrera_periodo,
    id_carrera_docente: docentes.presidente,
    caso: d.caso, // puede venir o no
    nombre_tribunal: String(d.nombre_tribunal).trim(),
    descripcion_tribunal: d.descripcion_tribunal ? String(d.descripcion_tribunal).trim() : null,
    docentes,
  };

  const id = await repo.createWithDocentes(payload);
  return get(id, scope);
}

async function update(id, d, scope = null) {
  const current = await get(id, scope); // valida existencia + scope

  if (!d.nombre_tribunal || !String(d.nombre_tribunal).trim()) {
    throw err("nombre_tribunal es requerido", 422);
  }

  if (!d.id_carrera_periodo) throw err("id_carrera_periodo es requerido", 422);

  // caso opcional: si lo mandan, lo respetamos, si no -> se mantiene
  if (d.caso != null && d.caso !== "") {
    const c = +d.caso;
    if (!Number.isInteger(c) || c < 1) throw err("caso debe ser entero >= 1", 422);
    d.caso = c;
  } else {
    d.caso = null;
  }

  // si mandan docentes, validamos coherencia; si no mandan, se mantiene
  let docentes = null;
  if (d.docentes) {
    const r = await validarCoherenciaCarrera(d, scope);
    docentes = r.docentes;
  }

  const payload = {
    id_carrera_periodo: +d.id_carrera_periodo,
    id_carrera_docente: docentes ? docentes.presidente : current.id_carrera_docente,
    caso: d.caso, // null -> repo mantiene el actual
    nombre_tribunal: String(d.nombre_tribunal).trim(),
    descripcion_tribunal: d.descripcion_tribunal ? String(d.descripcion_tribunal).trim() : null,
    docentes, // null -> no toca tribunal_docente
  };

  await repo.updateWithDocentes(+id, payload);
  return get(+id, scope);
}

async function changeEstado(id, estado, scope = null) {
  await get(id, scope);
  return repo.setEstado(id, estado);
}

module.exports = { list, get, create, update, changeEstado };
