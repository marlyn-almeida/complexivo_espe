// src/controllers/plan_evaluacion_item.controller.js
const service = require("../services/plan_evaluacion_item.service");

function ok(res, data) {
  return res.json({ ok: true, data });
}

module.exports = {
  // PLAN
  getPlanByCP: async (req, res) => {
    const id_carrera_periodo = req.id_carrera_periodo;
    const plan = await service.getPlanByCP(id_carrera_periodo);
    return ok(res, plan);
  },

  createPlan: async (req, res) => {
    const id_carrera_periodo = req.id_carrera_periodo;
    const id = await service.createPlan(id_carrera_periodo, req.body);
    return ok(res, { id_plan_evaluacion: id });
  },

  updatePlan: async (req, res) => {
    const id_carrera_periodo = req.id_carrera_periodo;
    const id_plan_evaluacion = req.params.id_plan_evaluacion;
    const affected = await service.updatePlan(id_carrera_periodo, id_plan_evaluacion, req.body);
    return ok(res, { affected });
  },

  // ÍTEMS
  listItems: async (req, res) => {
    const id_carrera_periodo = req.id_carrera_periodo;
    const id_plan_evaluacion = req.params.id_plan_evaluacion;
    const rows = await service.listItems(id_carrera_periodo, id_plan_evaluacion);
    return ok(res, rows);
  },

  createItem: async (req, res) => {
    const id_carrera_periodo = req.id_carrera_periodo;
    const id_plan_evaluacion = req.params.id_plan_evaluacion;
    const id = await service.createItem(id_carrera_periodo, id_plan_evaluacion, req.body);
    return ok(res, { id_plan_item: id });
  },

  updateItem: async (req, res) => {
    const id_carrera_periodo = req.id_carrera_periodo;
    const id_plan_item = req.params.id_plan_item;
    const affected = await service.updateItem(id_carrera_periodo, id_plan_item, req.body);
    return ok(res, { affected });
  },

  // RÚBRICA: por componente
  setComponentCalificador: async (req, res) => {
    const id_carrera_periodo = req.id_carrera_periodo;
    const id_plan_item = req.params.id_plan_item;
    const id_rubrica_componente = req.params.id_rubrica_componente;
    const { calificado_por } = req.body;

    const affected = await service.setComponentCalificador({
      id_carrera_periodo,
      id_plan_item,
      id_rubrica_componente,
      calificado_por,
    });

    return ok(res, { affected });
  },

  listComponentCalificadores: async (req, res) => {
    const id_carrera_periodo = req.id_carrera_periodo;
    const id_plan_item = req.params.id_plan_item;
    const rows = await service.listComponentCalificadores(id_carrera_periodo, id_plan_item);
    return ok(res, rows);
  },

  // ✅ NUEVO: calificadores generales por ítem NO rúbrica
  listItemCalificadoresGenerales: async (req, res) => {
    const id_carrera_periodo = req.id_carrera_periodo;
    const id_plan_item = req.params.id_plan_item;
    const rows = await service.listItemCalificadoresGenerales(id_carrera_periodo, id_plan_item);
    return ok(res, rows);
  },

  setItemCalificadoresGenerales: async (req, res) => {
    const id_carrera_periodo = req.id_carrera_periodo;
    const id_plan_item = req.params.id_plan_item;
    const { ids_cp_calificador_general } = req.body;

    const result = await service.setItemCalificadoresGenerales(
      id_carrera_periodo,
      id_plan_item,
      ids_cp_calificador_general
    );

    return ok(res, result);
  },
};
