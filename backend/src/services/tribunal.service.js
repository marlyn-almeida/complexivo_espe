// src/services/tribunal.service.js
const repo = require("../repositories/tribunal.repo");

function roleName(user) {
  // soporta "ADMIN" / "DOCENTE" / "SUPER_ADMIN" y también números 1/2/3 si algún día llegan
  const r = user?.activeRole ?? user?.rol ?? null;
  if (!r) return null;
  if (typeof r === "string") return r;
  const n = Number(r);
  if (n === 1) return "SUPER_ADMIN";
  if (n === 2) return "ADMIN";
  if (n === 3) return "DOCENTE";
  return null;
}

function isAdmin(user) {
  return roleName(user) === "ADMIN";
}
function isDocente(user) {
  return roleName(user) === "DOCENTE";
}
function isSuperAdmin(user) {
  return roleName(user) === "SUPER_ADMIN";
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

async function list(query = {}, user, ctx = null) {
  // ✅ ADMIN: carrera_periodo viene del ctx (header x-carrera-periodo-id)
  const cpCtx = Number(ctx?.id_carrera_periodo) || null;

  // SUPER_ADMIN puede usar query.carreraPeriodoId si quiere
  const cpQuery = query.carreraPeriodoId ? Number(query.carreraPeriodoId) : null;

  const carreraPeriodoId =
    isAdmin(user) ? cpCtx : (cpQuery || cpCtx); // SUPER_ADMIN: permite filtro por query o header

  return repo.findAll({
    includeInactive: Boolean(query.includeInactive),
    carreraPeriodoId,
  });
}

async function get(id, user, ctx = null) {
  const t = await repo.findById(id);
  if (!t) {
    const e = new Error("Tribunal no encontrado");
    e.status = 404;
    throw e;
  }

  // ✅ ADMIN: no puede leer tribunales fuera del CP activo
  if (isAdmin(user)) {
    const cpCtx = Number(ctx?.id_carrera_periodo) || 0;
    if (cpCtx > 0 && Number(t.id_carrera_periodo) !== cpCtx) {
      const e = new Error("Acceso denegado: tribunal fuera de tu Carrera–Período activo");
      e.status = 403;
      throw e;
    }
  }

  t.docentes = await repo.findDocentesByTribunal(id);
  return t;
}

async function create(d, user, ctx = null) {
  const okCP = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!okCP) {
    const e = new Error("La relación carrera_periodo no existe");
    e.status = 422;
    throw e;
  }

  // ✅ ADMIN: solo puede crear para el CP activo
  if (isAdmin(user)) {
    const cpCtx = Number(ctx?.id_carrera_periodo) || 0;
    if (cpCtx > 0 && Number(d.id_carrera_periodo) !== cpCtx) {
      const e = new Error("Acceso denegado: solo puedes crear tribunales para tu Carrera–Período activo");
      e.status = 403;
      throw e;
    }
  }

  validarDocentes(d.docentes);

  // validar carrera_docente existan y estén activos
  const ids = [+d.docentes.presidente, +d.docentes.integrante1, +d.docentes.integrante2];

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

async function update(id, d, user, ctx = null) {
  await get(id, user, ctx);

  const okCP = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!okCP) {
    const e = new Error("La relación carrera_periodo no existe");
    e.status = 422;
    throw e;
  }

  // ✅ ADMIN: solo puede mover/editar dentro del CP activo
  if (isAdmin(user)) {
    const cpCtx = Number(ctx?.id_carrera_periodo) || 0;
    if (cpCtx > 0 && Number(d.id_carrera_periodo) !== cpCtx) {
      const e = new Error("Acceso denegado: solo puedes editar tribunales del CP activo");
      e.status = 403;
      throw e;
    }
  }

  if (d.docentes) {
    validarDocentes(d.docentes);

    const ids = [+d.docentes.presidente, +d.docentes.integrante1, +d.docentes.integrante2];

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
    docentes: d.docentes,
  });

  const updated = await repo.findById(id);
  updated.docentes = await repo.findDocentesByTribunal(id);
  return updated;
}

async function changeEstado(id, estado, user, ctx = null) {
  await get(id, user, ctx);
  return repo.setEstado(id, estado);
}

async function misTribunales(query = {}, user) {
  if (!isDocente(user)) {
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
