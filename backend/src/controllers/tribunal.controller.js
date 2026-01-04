const s = require("../services/tribunal.service");

module.exports = {
  list: async (req, res, n) => {
    try {
      res.json(await s.list(req.query, req.user?.scope || null));
    } catch (e) {
      n(e);
    }
  },

  get: async (req, res, n) => {
    try {
      res.json(await s.get(req.params.id, req.user?.scope || null));
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

  update: async (req, res, n) => {
    try {
      res.json(await s.update(req.params.id, req.body, req.user?.scope || null));
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
};
