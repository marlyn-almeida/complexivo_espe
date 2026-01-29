const s = require("../services/docente.service");

module.exports = {
  // =========================
  // LIST
  // =========================
  list: async (req, res, next) => {
    try {
      res.json(await s.list(req.query, req.user));
    } catch (e) {
      next(e);
    }
  },

  // =========================
  // GET BY ID
  // =========================
  get: async (req, res, next) => {
    try {
      res.json(await s.get(req.params.id, req.user));
    } catch (e) {
      next(e);
    }
  },

  // =========================
  // GET /me
  // =========================
  me: async (req, res, next) => {
    try {
      res.json(await s.get(Number(req.user.id), req.user));
    } catch (e) {
      next(e);
    }
  },

  // =========================
  // CREATE (manual)
  // =========================
  create: async (req, res, next) => {
    try {
      res.status(201).json(await s.create(req.body, req.user));
    } catch (e) {
      next(e);
    }
  },

  // =========================
  // UPDATE (SIN PASSWORD)
  // =========================
  update: async (req, res, next) => {
    try {
      res.json(await s.update(req.params.id, req.body, req.user));
    } catch (e) {
      next(e);
    }
  },

  // =========================
  // CHANGE ESTADO
  // =========================
  changeEstado: async (req, res, next) => {
    try {
      res.json(await s.changeEstado(req.params.id, req.body.estado, req.user));
    } catch (e) {
      next(e);
    }
  },

  // =========================
  // SUPER ADMIN
  // =========================
  setSuperAdmin: async (req, res, next) => {
    try {
      res.json(await s.setSuperAdmin(req.params.id, req.body, req.user));
    } catch (e) {
      next(e);
    }
  },

  // =========================
  // IMPORT MASIVO
  // =========================
  importBulk: async (req, res, next) => {
    try {
      /**
       * Body esperado:
       * {
       *   id_departamento: number,
       *   rows: DocenteImportRow[]
       * }
       */
      const { id_departamento, rows } = req.body;

      const result = await s.importBulk(
        {
          id_departamento,
          rows,
        },
        req.user
      );

      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  },
};
