// src/services/calificacion.service.js
const repo = require("../repositories/calificacion.repo");

const TIPOS_OK = new Set(["TEORICO", "PRACTICO_ESCRITA", "PRACTICO_ORAL", "FINAL"]);

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

function isDocente(user) {
  return user?.rol === "DOCENTE";
}

function validarNota(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0 || num > 20) {
    throw err("nota_base20 debe estar entre 0 y 20", 422);
  }
  return Number(num.toFixed(2));
}

/**
 * ✅ COHERENCIA REAL CON TU BD:
 * - rubrica pertenece a un PERIODO (rubrica.id_periodo)
 * - tribunal_estudiante pertenece a un CP, y CP pertenece a un PERIODO (carrera_periodo.id_periodo)
 * => deben coincidir por id_periodo
 */
async function validarCoherencia(id_tribunal_estudiante, id_rubrica) {
  const te = await repo.getTribunalEstudianteBase(id_tribunal_estudiante);
  if (!te) throw err("tribunal_estudiante no existe", 422);

  const r = await repo.getRubrica(id_rubrica);
  if (!r) throw err("rubrica no existe", 422);

  if (+te.id_periodo !== +r.id_periodo) {
    throw err("La rúbrica no pertenece al mismo período del tribunal_estudiante", 422);
  }
}

// =======================
// ADMIN (lo que ya tenías)
// =======================
async function list(q) {
  return repo.findAll({
    includeInactive: q.includeInactive === true || q.includeInactive === "true",
    tribunalEstudianteId: q.tribunalEstudianteId || null,
    rubricaId: q.rubricaId || null,
  });
}

async function get(id) {
  const c = await repo.findById(id);
  if (!c) throw err("Calificación no encontrada", 404);
  return c;
}

async function create(d) {
  if (!TIPOS_OK.has(d.tipo_rubrica)) throw err("tipo_rubrica inválido", 422);

  await validarCoherencia(d.id_tribunal_estudiante, d.id_rubrica);
  d.nota_base20 = validarNota(d.nota_base20);

  const dup = await repo.findOneByKey(d.id_tribunal_estudiante, d.id_rubrica, d.tipo_rubrica);
  if (dup) throw err("Ya existe calificación para ese tipo", 409);

  return repo.create(d);
}

async function update(id, d) {
  const existing = await get(id);

  if (!TIPOS_OK.has(d.tipo_rubrica)) throw err("tipo_rubrica inválido", 422);

  await validarCoherencia(existing.id_tribunal_estudiante, existing.id_rubrica);
  d.nota_base20 = validarNota(d.nota_base20);

  return repo.update(id, d);
}

async function changeEstado(id, estado) {
  await get(id);
  return repo.setEstado(id, estado);
}

// =======================
// ✅ DOCENTE (arreglo)
// =======================

/**
 * ✅ CLAVE:
 * - Si cp viene 0/null (DOCENTE), NO filtramos por CP para encontrar su agenda.
 * - Luego tomamos cpReal desde la asignación (ctx.id_carrera_periodo) y con eso
 *   buscamos el plan activo.
 */
async function misCalificaciones(cp, id_tribunal_estudiante, user) {
  if (!isDocente(user)) throw err("Acceso denegado", 403);

  const cpIn = Number(cp || 0);

  const ctx = await repo.getCtxDocenteTribunalEstudiante({
    cp: cpIn,
    id_tribunal_estudiante,
    id_docente: Number(user.id),
  });

  if (!ctx) throw err("Asignación no encontrada o no pertenece a tu agenda.", 404);

  // ✅ CP REAL SIEMPRE desde DB (no del header)
  const cpReal = Number(ctx.id_carrera_periodo || 0);
  if (!cpReal) throw err("No se pudo determinar el Carrera–Período para calificar.", 422);

  const plan = await repo.getPlanActivoByCP(cpReal);
  if (!plan) throw err("No existe plan de evaluación activo para esta carrera-período.", 404);

  const estructura = await repo.getEstructuraParaDocente({
    id_plan_evaluacion: plan.id_plan_evaluacion,
    designacion: ctx.mi_designacion,
  });

  const existentes = await repo.getCalificacionesDocente({
    id_tribunal_estudiante,
    id_docente_califica: Number(user.id),
  });

  return {
    ok: true,
    data: {
      plan,
      id_tribunal_estudiante,
      mi_designacion: ctx.mi_designacion,
      cerrado: !!ctx.cerrado,
      estructura,
      existentes,
    },
  };
}

async function guardarMisCalificaciones(cp, id_tribunal_estudiante, user, payload) {
  if (!isDocente(user)) throw err("Acceso denegado", 403);

  const cpIn = Number(cp || 0);

  const ctx = await repo.getCtxDocenteTribunalEstudiante({
    cp: cpIn,
    id_tribunal_estudiante,
    id_docente: Number(user.id),
  });

  if (!ctx) throw err("Asignación no encontrada o no pertenece a tu agenda.", 404);

  if (Number(ctx.cerrado) === 1) {
    throw err("Esta asignación está cerrada. No se pueden registrar calificaciones.", 409);
  }

  const cpReal = Number(ctx.id_carrera_periodo || 0);
  if (!cpReal) throw err("No se pudo determinar el Carrera–Período para calificar.", 422);

  const plan = await repo.getPlanActivoByCP(cpReal);
  if (!plan) throw err("No existe plan de evaluación activo para esta carrera-período.", 404);

  const allowed = await repo.getAllowedMap({
    id_plan_evaluacion: plan.id_plan_evaluacion,
    designacion: ctx.mi_designacion,
  });

  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw err("Debe enviar items[]", 422);

  const toSave = [];

  for (const it of items) {
    const id_plan_item = Number(it.id_plan_item);
    if (!Number.isFinite(id_plan_item) || id_plan_item <= 0) {
      throw err("Cada item debe incluir id_plan_item válido", 422);
    }

    // ✅ antes esto podía venir vacío y no te enterabas
    const comps = Array.isArray(it.componentes) ? it.componentes : [];
    if (!comps.length) {
      throw err("Cada item debe incluir componentes[] (no puede venir vacío)", 422);
    }

    for (const comp of comps) {
      const id_comp = Number(comp.id_rubrica_componente);
      if (!Number.isFinite(id_comp) || id_comp <= 0) {
        throw err("Cada componente debe incluir id_rubrica_componente válido", 422);
      }

      const criterios = Array.isArray(comp.criterios) ? comp.criterios : [];
      if (!criterios.length) {
        throw err("Cada componente debe incluir criterios[] (no puede venir vacío)", 422);
      }

      for (const c of criterios) {
        const idCrit = Number(c.id_rubrica_criterio);
        const idNivel = Number(c.id_rubrica_nivel);

        if (!Number.isFinite(idCrit) || idCrit <= 0) throw err("id_rubrica_criterio inválido", 422);
        if (!Number.isFinite(idNivel) || idNivel <= 0) throw err("id_rubrica_nivel inválido", 422);

        const key = `${id_plan_item}:${id_comp}:${idCrit}`;
        if (!allowed.has(key)) {
          throw err("Intentas calificar un criterio/componente que no te corresponde según el Plan.", 403);
        }

        toSave.push({
          id_tribunal_estudiante: Number(id_tribunal_estudiante),
          id_plan_item,
          id_rubrica_componente: id_comp,
          id_rubrica_criterio: idCrit,
          id_rubrica_nivel: idNivel,
          observacion: c.observacion ?? null,
          id_docente_califica: Number(user.id),
        });
      }
    }
  }

  await repo.upsertCriteriosCalificacion(toSave);

  // ✅ devolvemos vista actualizada usando cpReal
  return misCalificaciones(cpReal, id_tribunal_estudiante, user);
}

module.exports = {
  list,
  get,
  create,
  update,
  changeEstado,
  validarNota,
  validarCoherencia,
  TIPOS_OK,

  misCalificaciones,
  guardarMisCalificaciones,
};
