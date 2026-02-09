// ✅ src/controllers/tribunal_estudiante.controller.js
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

  // ✅ cerrar/abrir asignación
  changeCierre: async (req, res, next) => {
    try {
      res.json(await s.changeCierre(req.params.id, req.body.cerrado, req.user || null));
    } catch (e) {
      next(e);
    }
  },

  // ✅ ROL 3
  misAsignaciones: async (req, res, next) => {
    try {
      res.json(await s.misAsignaciones(req.query, req.user));
    } catch (e) {
      next(e);
    }
  },

  // ✅ ROL 3: contexto para panel de notas
  contextoCalificar: async (req, res, next) => {
    try {
      const cp = Number(req.ctx?.id_carrera_periodo || 0);
      res.json(await s.contextoCalificar(Number(req.params.id), cp, req.user));
    } catch (e) {
      next(e);
    }
  },
};
