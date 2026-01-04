const repo = require("../repositories/tribunal.repo");

function isRol2(user) {
  return Number(user?.rol) === 2;
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
    includeInactive: query.includeInactive === "true",
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

  // si es rol 2: validar que el tribunal sea de su carrera (por carrera_periodo)
  if (isRol2(user)) {
    const carreraId = await repo.getCarreraIdByCarreraPeriodo(t.id_carrera_periodo);
    if (Number(carreraId) !== Number(user?.scope?.id_carrera)) {
      const e = new Error("Acceso denegado: tribunal fuera de tu carrera");
      e.status = 403;
      throw e;
    }
  }

  // opcional: incluir docentes asignados
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
  if (!carreraId) {
    const e = new Error("No se pudo determinar la carrera del carrera_periodo");
    e.status = 422;
    throw e;
  }

  // rol 2: no puede crear para otra carrera
  if (isRol2(user) && Number(carreraId) !== Number(user?.scope?.id_carrera)) {
    const e = new Error("Acceso denegado: solo puedes crear tribunales para tu carrera");
    e.status = 403;
    throw e;
  }

  // validar cada carrera_docente
  const ids = [
    { id: +d.docentes.presidente, label: "PRESIDENTE" },
    { id: +d.docentes.integrante1, label: "INTEGRANTE_1" },
    { id: +d.docentes.integrante2, label: "INTEGRANTE_2" },
  ];

  for (const x of ids) {
    const cd = await repo.getCarreraIdByCarreraDocente(x.id);
    if (!cd || Number(cd.estado) !== 1) {
      const e = new Error(`carrera_docente inválido o inactivo (${x.label})`);
      e.status = 422;
      throw e;
    }
    if (Number(cd.id_carrera) !== Number(carreraId)) {
      const e = new Error(`El docente (${x.label}) no pertenece a la carrera del tribunal`);
      e.status = 422;
      throw e;
    }
  }

  // ✅ campo legacy en tribunal: id_carrera_docente = PRESIDENTE
  const tribunalId = await repo.createWithDocentes({
    id_carrera_periodo: d.id_carrera_periodo,
    id_carrera_docente: +d.docentes.presidente,
    caso: d.caso, // opcional: si no viene, repo lo genera
    nombre_tribunal: d.nombre_tribunal,
    descripcion_tribunal: d.descripcion_tribunal ?? null,
    docentes: d.docentes,
  });

  const created = await repo.findById(tribunalId);
  created.docentes = await repo.findDocentesByTribunal(tribunalId);
  return created;
}

async function update(id, d, user) {
  await get(id, user); // valida existencia + scope rol 2

  const okCP = await repo.carreraPeriodoExists(d.id_carrera_periodo);
  if (!okCP) {
    const e = new Error("La relación carrera_periodo no existe");
    e.status = 422;
    throw e;
  }

  // si mandan docentes, validarlos y validar coherencia
  if (d.docentes) {
    validarDocentes(d.docentes);

    const carreraId = await repo.getCarreraIdByCarreraPeriodo(d.id_carrera_periodo);
    if (!carreraId) {
      const e = new Error("No se pudo determinar la carrera del carrera_periodo");
      e.status = 422;
      throw e;
    }

    if (isRol2(user) && Number(carreraId) !== Number(user?.scope?.id_carrera)) {
      const e = new Error("Acceso denegado: solo puedes actualizar tribunales de tu carrera");
      e.status = 403;
      throw e;
    }

    const ids = [
      { id: +d.docentes.presidente, label: "PRESIDENTE" },
      { id: +d.docentes.integrante1, label: "INTEGRANTE_1" },
      { id: +d.docentes.integrante2, label: "INTEGRANTE_2" },
    ];

    for (const x of ids) {
      const cd = await repo.getCarreraIdByCarreraDocente(x.id);
      if (!cd || Number(cd.estado) !== 1) {
        const e = new Error(`carrera_docente inválido o inactivo (${x.label})`);
        e.status = 422;
        throw e;
      }
      if (Number(cd.id_carrera) !== Number(carreraId)) {
        const e = new Error(`El docente (${x.label}) no pertenece a la carrera del tribunal`);
        e.status = 422;
        throw e;
      }
    }
  }

  // id_carrera_docente legacy: si mandan docentes, PRESIDENTE; si no, mantener el que venga
  const idCarreraDocente = d.docentes ? +d.docentes.presidente : +d.id_carrera_docente;

  await repo.updateWithDocentes(id, {
    id_carrera_periodo: d.id_carrera_periodo,
    id_carrera_docente: idCarreraDocente,
    caso: d.caso,
    nombre_tribunal: d.nombre_tribunal,
    descripcion_tribunal: d.descripcion_tribunal ?? null,
    docentes: d.docentes, // opcional
  });

  const updated = await repo.findById(id);
  updated.docentes = await repo.findDocentesByTribunal(id);
  return updated;
}

async function changeEstado(id, estado, user) {
  await get(id, user);
  return repo.setEstado(id, estado);
}

module.exports = { list, get, create, update, changeEstado };
