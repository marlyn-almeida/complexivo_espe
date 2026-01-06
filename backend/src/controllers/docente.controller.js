// src/controllers/docente.controller.js
const s = require("../services/docente.service");

module.exports = {
  list: async (req, res, next) => {
    try {
      res.json(await s.list(req.query, req.user));
    } catch (e) {
      next(e);
    }
  },

  get: async (req, res, next) => {
    try {
      res.json(await s.get(req.params.id, req.user));
    } catch (e) {
      next(e);
    }
  },

  // ✅ GET /api/docentes/me
  me: async (req, res, next) => {
    try {
      res.json(await s.get(Number(req.user.id), req.user));
    } catch (e) {
      next(e);
    }
  },

  create: async (req, res, next) => {
    try {
      res.status(201).json(await s.create(req.body, req.user));
    } catch (e) {
      next(e);
    }
  },

  update: async (req, res, next) => {
    try {
      res.json(await s.update(req.params.id, req.body, req.user));
    } catch (e) {
      next(e);
    }
  },

  changeEstado: async (req, res, next) => {
    try {
      res.json(await s.changeEstado(req.params.id, req.body.estado, req.user));
    } catch (e) {
      next(e);
    }
  },

  // ✅ PATCH /api/docentes/:id/super-admin
  setSuperAdmin: async (req, res, next) => {
    try {
      res.json(await s.setSuperAdmin(req.params.id, req.body, req.user));
    } catch (e) {
      next(e);
    }
  },
};
