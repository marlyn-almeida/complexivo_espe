// src/services/plan_evaluacion_item.service.js
const repo = require("../repositories/plan_evaluacion_item.repository");

function err(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = {
  /* =========================
     PLAN
     ========================= */
  getPlanByCP: async (id_carrera_periodo) => {
    return repo.getPlanByCP(id_carrera_periodo);
  },

  createPlan: async (id_carrera_periodo, payload) => {
    const existing = await repo.getPlanByCP(id_carrera_periodo);
    if (existing) throw err("Ya existe un plan de evaluación para este Carrera–Período.", 409);

    return repo.createPlan({
      id_carrera_periodo,
      nombre_plan: payload.nombre_plan,
      descripcion_plan: payload.descripcion_plan,
    });
  },

  updatePlan: async (id_carrera_periodo, id_plan_evaluacion, patch) => {
    const okCP = await repo.validatePlanInCP(id_plan_evaluacion, id_carrera_periodo);
    if (!okCP) throw err("Plan no pertenece al Carrera–Período activo.", 403);

    return repo.updatePlan(id_plan_evaluacion, patch);
  },

  /* =========================
     ÍTEMS
     ========================= */
  listItems: async (id_carrera_periodo, id_plan_evaluacion) => {
    const okCP = await repo.validatePlanInCP(id_plan_evaluacion, id_carrera_periodo);
    if (!okCP) throw err("Plan no pertenece al Carrera–Período activo.", 403);

    return repo.listItems(id_plan_evaluacion);
  },

  createItem: async (id_carrera_periodo, id_plan_evaluacion, data) => {
    const okCP = await repo.validatePlanInCP(id_plan_evaluacion, id_carrera_periodo);
    if (!okCP) throw err("Plan no pertenece al Carrera–Período activo.", 403);

    // Reglas tipo_item vs id_rubrica
    if (data.tipo_item === "RUBRICA" && !data.id_rubrica) {
      throw err("Si tipo_item = RUBRICA, id_rubrica es obligatorio.");
    }
    if (data.tipo_item === "NOTA_DIRECTA" && data.id_rubrica) {
      throw err("Si tipo_item = NOTA_DIRECTA, id_rubrica debe ser null.");
    }

    // (Opcional) Validar que la rúbrica pertenezca al período del CP
    if (data.tipo_item === "RUBRICA") {
      const okRub = await repo.validateRubricaMatchesCP(id_carrera_periodo, data.id_rubrica);
      if (!okRub) throw err("La rúbrica no corresponde al período del Carrera–Período activo.", 400);
    }

    return repo.createItem({
      id_plan_evaluacion,
      nombre_item: data.nombre_item,
      tipo_item: data.tipo_item,
      ponderacion_global_pct: data.ponderacion_global_pct,
      calificado_por: data.calificado_por,
      id_rubrica: data.id_rubrica || null,
    });
  },

  updateItem: async (id_carrera_periodo, id_plan_item, patch) => {
    // Validar que el item pertenezca al CP
    const item = await repo.getItemById(id_plan_item);
    if (!item) throw err("Ítem no encontrado.", 404);

    const okCP = await repo.validatePlanInCP(item.id_plan_evaluacion, id_carrera_periodo);
    if (!okCP) throw err("Ítem no pertenece al Carrera–Período activo.", 403);

    // Reglas si se intenta cambiar tipo_item / id_rubrica
    const tipo_item = patch.tipo_item ?? item.tipo_item;
    const id_rubrica = (patch.id_rubrica !== undefined) ? patch.id_rubrica : item.id_rubrica;

    if (tipo_item === "RUBRICA" && !id_rubrica) {
      throw err("Si tipo_item = RUBRICA, id_rubrica es obligatorio.");
    }
    if (tipo_item === "NOTA_DIRECTA" && id_rubrica) {
      throw err("Si tipo_item = NOTA_DIRECTA, id_rubrica debe ser null.");
    }

    if (tipo_item === "RUBRICA" && id_rubrica) {
      const okRub = await repo.validateRubricaMatchesCP(id_carrera_periodo, id_rubrica);
      if (!okRub) throw err("La rúbrica no corresponde al período del Carrera–Período activo.", 400);
    }

    return repo.updateItem(id_plan_item, patch);
  },

  /* =========================
     RÚBRICA: calificador por componente
     ========================= */
  setComponentCalificador: async ({ id_carrera_periodo, id_plan_item, id_rubrica_componente, calificado_por }) => {
    const item = await repo.getItemById(id_plan_item);
    if (!item) throw err("Ítem no encontrado.", 404);

    const okCP = await repo.validatePlanInCP(item.id_plan_evaluacion, id_carrera_periodo);
    if (!okCP) throw err("Ítem no pertenece al Carrera–Período activo.", 403);

    if (item.tipo_item !== "RUBRICA") {
      throw err("Este endpoint solo aplica para ítems tipo RUBRICA.", 400);
    }

    // Validar que el componente sea de la rúbrica del ítem
    const okComp = await repo.validateComponenteInRubrica(id_rubrica_componente, item.id_rubrica);
    if (!okComp) throw err("El componente no pertenece a la rúbrica del ítem.", 400);

    return repo.setComponentCalificador({ id_plan_item, id_rubrica_componente, calificado_por });
  },

  listComponentCalificadores: async (id_carrera_periodo, id_plan_item) => {
    const item = await repo.getItemById(id_plan_item);
    if (!item) throw err("Ítem no encontrado.", 404);

    const okCP = await repo.validatePlanInCP(item.id_plan_evaluacion, id_carrera_periodo);
    if (!okCP) throw err("Ítem no pertenece al Carrera–Período activo.", 403);

    return repo.listComponentCalificadores(id_plan_item);
  },

  /* =========================
     ✅ NUEVO: Calificadores Generales (ROL 3) por ítem NO rúbrica
     ========================= */

  listItemCalificadoresGenerales: async (id_carrera_periodo, id_plan_item) => {
    const item = await repo.getItemById(id_plan_item);
    if (!item) throw err("Ítem no encontrado.", 404);

    const okCP = await repo.validatePlanInCP(item.id_plan_evaluacion, id_carrera_periodo);
    if (!okCP) throw err("Ítem no pertenece al Carrera–Período activo.", 403);

    return repo.listItemCalificadoresGenerales(id_plan_item);
  },

  setItemCalificadoresGenerales: async (id_carrera_periodo, id_plan_item, ids_cp_calificador_general = []) => {
    const item = await repo.getItemById(id_plan_item);
    if (!item) throw err("Ítem no encontrado.", 404);

    const okCP = await repo.validatePlanInCP(item.id_plan_evaluacion, id_carrera_periodo);
    if (!okCP) throw err("Ítem no pertenece al Carrera–Período activo.", 403);

    // Solo aplica para NO rúbrica
    if (item.tipo_item !== "NOTA_DIRECTA") {
      throw err("Calificadores Generales por ítem solo aplica a tipo_item = NOTA_DIRECTA.", 400);
    }

    // Debe estar configurado como CALIFICADORES_GENERALES
    const calificado_por = item.calificado_por;
    if (calificado_por !== "CALIFICADORES_GENERALES") {
      throw err("Este ítem no está configurado para CALIFICADORES_GENERALES.", 400);
    }

    // Validar que TODOS pertenecen al CP y son DOCENTE rol 3
    for (const id_cg of ids_cp_calificador_general) {
      const okCG = await repo.validateCpCalificadorGeneralInCP({
        id_carrera_periodo,
        id_cp_calificador_general: id_cg,
      });
      if (!okCG) {
        throw err(`Calificador general inválido o no pertenece al CP activo (id_cp_calificador_general=${id_cg}).`, 400);
      }
    }

    // Reemplazo total (delete + insert)
    await repo.replaceItemCalificadoresGenerales(id_plan_item, ids_cp_calificador_general);

    const rows = await repo.listItemCalificadoresGenerales(id_plan_item);
    return { assigned: rows.length, rows };
  },
};
