// src/controllers/tribunal_estudiante.controller.js
const s = require("../services/tribunal_estudiante.service");

module.exports = {
  list: async (req, res, n) => {
    try {
      res.json(await s.list(req.query, req.user?.scope || null));
    } catch (e) {
      n(e);
    }
  },

  create: async (req, res, n) => {
    try {
      res.status(201).json(await s.create(req.body, req.user?.scope || null));
    } catch (e) {
      n(e);
    }
  },

  changeEstado: async (req, res, n) => {
    try {
      res.json(await s.changeEstado(req.params.id, req.body.estado, req.user?.scope || null));
    } catch (e) {
      n(e);
    }
  },

  // ✅ NUEVO: rol 3 (docente) -> ver sus asignaciones (agenda)
  misAsignaciones: async (req, res, n) => {
    try {
      res.json(await s.misAsignaciones(req.query, req.user));
    } catch (e) {
      n(e);
    }
  },
};
