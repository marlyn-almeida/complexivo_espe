const s = require("../services/acta.service");

module.exports = {
  generar: async (req, res, next) => {
    try {
      const result = await s.generarDesdeTribunalEstudiante(
        {
          id_tribunal_estudiante: Number(req.body.id_tribunal_estudiante),
          id_rubrica: Number(req.body.id_rubrica),
          fecha_acta: req.body.fecha_acta ?? null,
          umbral_aprobacion: req.body.umbral_aprobacion ?? 14,
        },
        req.user // si estás usando auth middleware
      );

      res.status(201).json({ ok: true, data: result });
    } catch (e) {
      next(e);
    }
  },

  get: async (req, res, next) => {
    try {
      const data = await s.get(Number(req.params.id));
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  },

  changeEstado: async (req, res, next) => {
    try {
      const data = await s.changeEstado(Number(req.params.id), Boolean(req.body.estado));
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  },
};
