const repo = require("../repositories/plan_evaluacion.repo");

async function getByCP(cp) {
  return repo.getPlanByCP(cp);
}

async function create(cp, body) {
  try {
    return await repo.createPlan({ ...body, id_carrera_periodo: cp });
  } catch (e) {
    if (e?.code === "ER_DUP_ENTRY") {
      const err = new Error("Ya existe un plan de evaluación para esta carrera-período");
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

async function update(cp, id_plan_evaluacion, patch) {
  const ok = await repo.validatePlanInCP(id_plan_evaluacion, cp);
  if (!ok) {
    const err = new Error("Plan fuera de tu carrera-período");
    err.status = 403;
    throw err;
  }
  const affected = await repo.updatePlan(id_plan_evaluacion, patch);
  if (!affected) {
    const err = new Error("Plan no encontrado");
    err.status = 404;
    throw err;
  }
  return true;
}

async function listItems(cp, id_plan_evaluacion) {
  const ok = await repo.validatePlanInCP(id_plan_evaluacion, cp);
  if (!ok) {
    const err = new Error("Plan fuera de tu carrera-período");
    err.status = 403;
    throw err;
  }
  return repo.listItems(id_plan_evaluacion);
}

async function createItem(cp, body) {
  // (Opcional) aquí puedes validar que el plan sea del CP,
  // pero si el front usa el plan del CP actual, basta
  return repo.createItem(body);
}

async function updateItem(id_plan_item, patch) {
  const affected = await repo.updateItem(id_plan_item, patch);
  if (!affected) {
    const err = new Error("Ítem no encontrado");
    err.status = 404;
    throw err;
  }
  return true;
}

async function setComponentCalificador(data) {
  return repo.setComponentCalificador(data);
}

async function listComponentCalificadores(id_plan_item) {
  return repo.listComponentCalificadores(id_plan_item);
}

module.exports = {
  getByCP, create, update,
  listItems, createItem, updateItem,
  setComponentCalificador, listComponentCalificadores,
};
