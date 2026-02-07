// src/controllers/tribunal_estudiante.controller.js
const s = require("../services/tribunal_estudiante.service");

module.exports = {
  list: async (req, res, next) => {
    try {
      res.json(await s.list(req.query, req.user || null));
    } catch (e) {
      next(e);
    }
  },

  create: async (req, res, next) => {
    try {
      res.status(201).json(await s.create(req.body, req.user || null));
    } catch (e) {
      next(e);
    }
  },

  changeEstado: async (req, res, next) => {
    try {
      res.json(await s.changeEstado(req.params.id, req.body.estado, req.user || null));
    } catch (e) {
      next(e);
    }
  },

  misAsignaciones: async (req, res, next) => {
    try {
      res.json(await s.misAsignaciones(req.query, req.user));
    } catch (e) {
      next(e);
    }
  },
};
