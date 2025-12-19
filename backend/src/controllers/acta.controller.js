const s = require("../services/acta.service");

module.exports = {
  generar: async (req,res,n)=>{ try{res.status(201).json(await s.generarDesdeTribunalEstudiante(req.body));}catch(e){n(e);} },
  get: async (req,res,n)=>{ try{res.json(await s.get(req.params.id));}catch(e){n(e);} },
  changeEstado: async (req,res,n)=>{ try{res.json(await s.changeEstado(req.params.id, req.body.estado));}catch(e){n(e);} }
};
