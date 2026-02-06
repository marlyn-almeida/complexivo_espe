// src/controllers/estudiante_caso_asignacion.controller.js
const svc = require("../services/estudiante_caso_asignacion.service");

async function list(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const includeInactive = req.query.includeInactive === true;
    const data = await svc.list(cp, includeInactive);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function upsert(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);

    const payload = {
      id_estudiante: Number(req.body.id_estudiante),
      id_caso_estudio: Number(req.body.id_caso_estudio),
    };

    const asignacion = await svc.upsert(cp, payload);
    res.status(201).json({ ok: true, data: asignacion });
  } catch (e) {
    next(e);
  }
}

async function changeEstado(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_estudiante = Number(req.params.id_estudiante);
    const estado = req.body.estado === true;

    const data = await svc.changeEstado(cp, id_estudiante, estado);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, upsert, changeEstado };
