// src/controllers/tribunal.controller.js
const s = require("../services/tribunal.service");

module.exports = {
  list: async (req, res, next) => {
    try {
      res.json(await s.list(req.query, req.user || null, req.ctx || null));
    } catch (e) {
      next(e);
    }
  },

  get: async (req, res, next) => {
    try {
      res.json(await s.get(req.params.id, req.user || null, req.ctx || null));
    } catch (e) {
      next(e);
    }
  },

  create: async (req, res, next) => {
    try {
      res.status(201).json(await s.create(req.body, req.user || null, req.ctx || null));
    } catch (e) {
      next(e);
    }
  },

  update: async (req, res, next) => {
    try {
      res.json(await s.update(req.params.id, req.body, req.user || null, req.ctx || null));
    } catch (e) {
      next(e);
    }
  },

  changeEstado: async (req, res, next) => {
    try {
      res.json(await s.changeEstado(req.params.id, req.body.estado, req.user || null, req.ctx || null));
    } catch (e) {
      next(e);
    }
  },

  misTribunales: async (req, res, next) => {
    try {
      res.json(await s.misTribunales(req.query, req.user));
    } catch (e) {
      next(e);
    }
  },
};
