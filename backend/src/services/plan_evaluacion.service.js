// plan_evaluacion.service.js
const repo = require("../repositories/plan_evaluacion.repo");

function err(msg, status) {
  const e = new Error(msg);
  e.status = status;
  return e;
}

function isDocente(user) {
  // tu auth.middleware normaliza rol a string
  return user?.rol === "DOCENTE";
}

async function getByCP(cp) {
  return repo.getPlanByCP(cp);
}

async function create(cp, body) {
  try {
    return await repo.createPlan({ ...body, id_carrera_periodo: cp });
  } catch (e) {
    if (e?.code === "ER_DUP_ENTRY") {
      const er = new Error("Ya existe un plan de evaluación para esta carrera-período");
      er.status = 409;
      throw er;
    }
    throw e;
  }
}

async function update(cp, id_plan_evaluacion, patch) {
  const ok = await repo.validatePlanInCP(id_plan_evaluacion, cp);
  if (!ok) throw err("Plan fuera de tu carrera-período", 403);

  const affected = await repo.updatePlan(id_plan_evaluacion, patch);
  if (!affected) throw err("Plan no encontrado", 404);

  return true;
}

async function listItems(cp, id_plan_evaluacion) {
  const ok = await repo.validatePlanInCP(id_plan_evaluacion, cp);
  if (!ok) throw err("Plan fuera de tu carrera-período", 403);

  return repo.listItems(id_plan_evaluacion);
}

async function createItem(cp, body) {
  // opcional: validar plan pertenece a cp, lo dejamos igual
  return repo.createItem(body);
}

async function updateItem(id_plan_item, patch) {
  const affected = await repo.updateItem(id_plan_item, patch);
  if (!affected) throw err("Ítem no encontrado", 404);
  return true;
}

async function setComponentCalificador(data) {
  return repo.setComponentCalificador(data);
}

async function listComponentCalificadores(id_plan_item) {
  return repo.listComponentCalificadores(id_plan_item);
}

// ✅ NUEVO DOCENTE
async function misItemsTribunal(cp, id_tribunal_estudiante, user) {
  if (!isDocente(user)) throw err("Acceso denegado", 403);

  const ctx = await repo.getDocenteDesignacionFromTribunalEstudiante({
    cp,
    id_tribunal_estudiante,
    id_docente: Number(user.id),
  });

  if (!ctx) throw err("Asignación no encontrada o no pertenece a tu agenda.", 404);

  const plan = await repo.getPlanByCP(cp);
  if (!plan) throw err("No existe plan de evaluación activo para esta carrera-período.", 404);

  const items = await repo.getItemsTribunalPorDesignacion({
    id_plan_evaluacion: plan.id_plan_evaluacion,
    designacion: ctx.mi_designacion,
  });

  return {
    ok: true,
    data: {
      plan,
      mi_designacion: ctx.mi_designacion,
      id_tribunal_estudiante,
      items,
    },
  };
}

module.exports = {
  getByCP,
  create,
  update,
  listItems,
  createItem,
  updateItem,
  setComponentCalificador,
  listComponentCalificadores,
  misItemsTribunal,
};
