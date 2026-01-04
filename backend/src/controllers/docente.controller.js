// src/controllers/docente.controller.js
const s = require("../services/docente.service");

module.exports = {
  list: async (req, res, n) => {
    try {
      res.json(await s.list(req.query, req.user));
    } catch (e) {
      n(e);
    }
  },

  get: async (req, res, n) => {
    try {
      res.json(await s.get(req.params.id, req.user));
    } catch (e) {
      n(e);
    }
  },

  // ✅ NUEVO: GET /api/docentes/me
  me: async (req, res, n) => {
    try {
      // En tu JWT: id = id_docente :contentReference[oaicite:1]{index=1}
      res.json(await s.get(Number(req.user.id), req.user));
    } catch (e) {
      n(e);
    }
  },

  create: async (req, res, n) => {
    try {
      res.status(201).json(await s.create(req.body, req.user));
    } catch (e) {
      n(e);
    }
  },

  update: async (req, res, n) => {
    try {
      res.json(await s.update(req.params.id, req.body, req.user));
    } catch (e) {
      n(e);
    }
  },

  changeEstado: async (req, res, n) => {
    try {
      res.json(await s.changeEstado(req.params.id, req.body.estado, req.user));
    } catch (e) {
      n(e);
    }
  },
};
