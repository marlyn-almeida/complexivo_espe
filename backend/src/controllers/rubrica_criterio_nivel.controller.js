const s = require("../services/rubrica_criterio_nivel.service");

module.exports = {
  list: async (req, res, n) => { try { res.json(await s.list(req.params.criterioId, req.query)); } catch (e) { n(e); } },
  upsert: async (req, res, n) => { try { res.status(201).json(await s.upsert(req.params.criterioId, req.body)); } catch (e) { n(e); } },
  changeEstado: async (req, res, n) => { try { res.json(await s.changeEstado(req.params.criterioId, req.params.id, req.body.estado)); } catch (e) { n(e); } },
};
