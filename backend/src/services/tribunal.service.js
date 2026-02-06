// src/services/tribunal.service.js
const repo = require("../repositories/tribunal.repo");

function isRol2(user) {
  return Number(user?.rol) === 2;
}

function isRol3(user) {
  return Number(user?.rol) === 3;
}

function validarDocentes(docentes) {
  if (!docentes || typeof docentes !== "object") {
    const e = new Error("Debe enviar docentes { presidente, integrante1, integrante2 }");
    e.status = 422;
    throw e;
  }

  const { presidente, integrante1, integrante2 } = docentes;

  if (!presidente || !integrante1 || !integrante2) {
    const e = new Error("Debe seleccionar presidente, integrante1 e integrante2");
    e.status = 422;
    throw e;
  }

  const set = new Set([+presidente, +integrante1, +integrante2]);
  if (set.size !== 3) {
    const e = new Error("No se puede repetir el mismo docente en el tribunal");
    e.status = 422;
    throw e;
  }
}

async function list(query = {}, user) {
  return repo.findAll({
    includeInactive: Boolean(query.includeInactive),
    carreraPeriodoId: query.carreraPeriodoId || null,
    scopeCarreraId: isRol2(user) ? user?.scope?.id_carrera : null,
  });
}

async function get(id, user) {
  const t = await repo.findById(id);
  if (!t) {
    const e = new Error("Tribunal no encontrado");
    e.status = 404;
    throw e;
  }

  if (isRol2(user)) {
    const carreraId = await repo.getCarreraIdByCarreraPeriodo(t.id_carrera_periodo);
    if (Number(carreraId) !== Number(user?.scope?.id_carrera)) {
      const e = new Error("Acceso denegado: tribunal fuera de tu carrera");
      e.status = 403;
      throw e;
    }
  }

  t.docentes = await repo.findDocentesByTribunal(id);
  return t;
}

async function create(d, user) {
  const okCP = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!okCP) {
    const e = new Error("La relación carrera_periodo no existe");
    e.status = 422;
    throw e;
  }

  validarDocentes(d.docentes);

  const carreraId = await repo.getCarreraIdByCarreraPeriodo(d.id_carrera_periodo);

  if (isRol2(user) && Number(carreraId) !== Number(user?.scope?.id_carrera)) {
    const e = new Error("Acceso denegado: solo puedes crear tribunales para tu carrera");
    e.status = 403;
    throw e;
  }

  // validar que carrera_docente existan y estén activos
  const ids = [
    +d.docentes.presidente,
    +d.docentes.integrante1,
    +d.docentes.integrante2,
  ];

  for (const idCd of ids) {
    const cd = await repo.getCarreraIdByCarreraDocente(idCd);
    if (!cd || Number(cd.estado) !== 1) {
      const e = new Error("carrera_docente inválido o inactivo");
      e.status = 422;
      throw e;
    }
  }

  const tribunalId = await repo.createWithDocentes({
    id_carrera_periodo: d.id_carrera_periodo,
    nombre_tribunal: d.nombre_tribunal,
    descripcion_tribunal: d.descripcion_tribunal ?? null,
    docentes: d.docentes,
  });

  const created = await repo.findById(tribunalId);
  created.docentes = await repo.findDocentesByTribunal(tribunalId);
  return created;
}

async function update(id, d, user) {
  await get(id, user);

  const okCP = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!okCP) {
    const e = new Error("La relación carrera_periodo no existe");
    e.status = 422;
    throw e;
  }

  if (d.docentes) {
    validarDocentes(d.docentes);

    const ids = [
      +d.docentes.presidente,
      +d.docentes.integrante1,
      +d.docentes.integrante2,
    ];

    for (const idCd of ids) {
      const cd = await repo.getCarreraIdByCarreraDocente(idCd);
      if (!cd || Number(cd.estado) !== 1) {
        const e = new Error("carrera_docente inválido o inactivo");
        e.status = 422;
        throw e;
      }
    }
  }

  await repo.updateWithDocentes(id, {
    id_carrera_periodo: d.id_carrera_periodo,
    nombre_tribunal: d.nombre_tribunal,
    descripcion_tribunal: d.descripcion_tribunal ?? null,
    docentes: d.docentes, // si no viene, NO toca tribunal_docente
  });

  const updated = await repo.findById(id);
  updated.docentes = await repo.findDocentesByTribunal(id);
  return updated;
}

async function changeEstado(id, estado, user) {
  await get(id, user);
  return repo.setEstado(id, estado);
}

async function misTribunales(query = {}, user) {
  if (!isRol3(user)) {
    const e = new Error("Acceso denegado");
    e.status = 403;
    throw e;
  }

  return repo.findMisTribunales({
    id_docente: Number(user.id),
    includeInactive: Boolean(query.includeInactive),
  });
}

module.exports = { list, get, create, update, changeEstado, misTribunales };
