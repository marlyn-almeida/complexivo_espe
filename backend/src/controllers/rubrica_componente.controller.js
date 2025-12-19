const s = require("../services/rubrica_componente.service");
module.exports = {
  list: async (req,res,n)=>{ try{res.json(await s.list(req.query));}catch(e){n(e);} },
  get: async (req,res,n)=>{ try{res.json(await s.get(req.params.id));}catch(e){n(e);} },
  create: async (req,res,n)=>{ try{res.status(201).json(await s.create(req.body));}catch(e){n(e);} },
  update: async (req,res,n)=>{ try{res.json(await s.update(req.params.id, req.body));}catch(e){n(e);} },
  changeEstado: async (req,res,n)=>{ try{res.json(await s.changeEstado(req.params.id, req.body.estado));}catch(e){n(e);} }
};
