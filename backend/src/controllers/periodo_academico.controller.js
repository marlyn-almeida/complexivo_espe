const s = require("../services/periodo_academico.service");

module.exports = {
  list: async (req, res, next) => {
    try {
      res.json(await s.list(req.query));
    } catch (e) {
      next(e);
    }
  },

  get: async (req, res, next) => {
    try {
      res.json(await s.get(req.params.id));
    } catch (e) {
      next(e);
    }
  },

  create: async (req, res, next) => {
    try {
      res.status(201).json(await s.create(req.body));
    } catch (e) {
      next(e);
    }
  },

  update: async (req, res, next) => {
    try {
      res.json(await s.update(req.params.id, req.body));
    } catch (e) {
      next(e);
    }
  },

  changeEstado: async (req, res, next) => {
    try {
      res.json(await s.changeEstado(req.params.id, req.body.estado));
    } catch (e) {
      next(e);
    }
  },
};
