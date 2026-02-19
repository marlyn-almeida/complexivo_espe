// src/controllers/acta.controller.js
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
        req.user
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

  // ✅ subir acta firmada (solo PRESIDENTE)
  subirFirmada: async (req, res, next) => {
    try {
      if (!req.file) {
        const e = new Error("Debe adjuntar un archivo PDF en el campo 'file'.");
        e.status = 422;
        throw e;
      }

      const data = await s.subirActaFirmada(Number(req.params.id), req.file, req.user);
      res.json({ ok: true, data });
    } catch (e) {
      next(e);
    }
  },
};
