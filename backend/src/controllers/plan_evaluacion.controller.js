const svc = require("../services/plan_evaluacion.service");

async function getByCP(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const data = await svc.getByCP(cp);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id = await svc.create(cp, req.body);
    res.status(201).json({ ok: true, id });
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_plan_evaluacion = Number(req.params.id_plan_evaluacion);
    await svc.update(cp, id_plan_evaluacion, req.body);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function listItems(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_plan_evaluacion = Number(req.params.id_plan_evaluacion);
    const data = await svc.listItems(cp, id_plan_evaluacion);
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function createItem(req, res, next) {
  try {
    const id = await svc.createItem(Number(req.ctx.id_carrera_periodo), req.body);
    res.status(201).json({ ok: true, id });
  } catch (e) { next(e); }
}

async function updateItem(req, res, next) {
  try {
    await svc.updateItem(Number(req.params.id_plan_item), req.body);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function setComponentCalificador(req, res, next) {
  try {
    await svc.setComponentCalificador(req.body);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function listComponentCalificadores(req, res, next) {
  try {
    const data = await svc.listComponentCalificadores(Number(req.params.id_plan_item));
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

module.exports = {
  getByCP, create, update,
  listItems, createItem, updateItem,
  setComponentCalificador, listComponentCalificadores,
};
