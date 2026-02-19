// backend/src/controllers/calificacion.controller.js
const s = require("../services/calificacion.service");

/**
 * Para DOCENTE:
 * - cp puede venir 0 (y está bien) para que el repo NO filtre por CP y pueda encontrar la asignación.
 * - luego el service toma cpReal desde DB (t.id_carrera_periodo) y con eso carga el plan.
 */
function getCp(req) {
  const cpQuery = Number(req.query?.cp || 0);
  const cpHeader = Number(req.header("x-carrera-periodo-id") || 0);

  // si existe query úsalo, si no header, si no 0
  return cpQuery || cpHeader || 0;
}

module.exports = {
  // =======================
  // ADMIN / SUPER_ADMIN
  // =======================
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

  // =======================
  // ✅ DOCENTE (ROL 3)
  // =======================

  // ✅ DOCENTE: ver lo que me toca
  misCalificaciones: async (req, res, n) => {
    try {
      const cp = getCp(req); // ✅ NO dependemos de req.ctx
      const id_te = Number(req.params.id_tribunal_estudiante);

      const out = await s.misCalificaciones(cp, id_te, req.user);
      res.json(out);
    } catch (e) {
      n(e);
    }
  },

  // ✅ DOCENTE: guardar
  guardarMisCalificaciones: async (req, res, n) => {
    try {
      const cp = getCp(req); // ✅ NO dependemos de req.ctx
      const id_te = Number(req.params.id_tribunal_estudiante);

      const out = await s.guardarMisCalificaciones(cp, id_te, req.user, req.body);
      res.json(out);
    } catch (e) {
      n(e);
    }
  },
};
