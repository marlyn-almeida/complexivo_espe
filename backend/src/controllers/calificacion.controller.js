// src/controllers/calificacion.controller.js
const s = require("../services/calificacion.service");

module.exports = {
  list: async (req, res, n) => {
    try {
      res.json(await s.list(req.query));
    } catch (e) {
      n(e);
    }
  },

  get: async (req, res, n) => {
    try {
      res.json(await s.get(req.params.id));
    } catch (e) {
      n(e);
    }
  },

  create: async (req, res, n) => {
    try {
      res.status(201).json(await s.create(req.body));
    } catch (e) {
      n(e);
    }
  },

  update: async (req, res, n) => {
    try {
      res.json(await s.update(req.params.id, req.body));
    } catch (e) {
      n(e);
    }
  },

  changeEstado: async (req, res, n) => {
    try {
      res.json(await s.changeEstado(req.params.id, req.body.estado));
    } catch (e) {
      n(e);
    }
  },

  // ✅ DOCENTE: ver lo que me toca
  misCalificaciones: async (req, res, n) => {
    try {
      const cp = Number(req.ctx.id_carrera_periodo);
      const id_te = Number(req.params.id_tribunal_estudiante);
      res.json(await s.misCalificaciones(cp, id_te, req.user));
    } catch (e) {
      n(e);
    }
  },

  // ✅ DOCENTE: guardar
  guardarMisCalificaciones: async (req, res, n) => {
    try {
      const cp = Number(req.ctx.id_carrera_periodo);
      const id_te = Number(req.params.id_tribunal_estudiante);
      res.json(await s.guardarMisCalificaciones(cp, id_te, req.user, req.body));
    } catch (e) {
      n(e);
    }
  },
};
