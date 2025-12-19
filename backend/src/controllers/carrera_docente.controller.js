const s = require("../services/carrera_docente.service");

async function list(req,res,next){ try{res.json(await s.list(req.query));}catch(e){next(e);} }
async function create(req,res,next){ try{res.status(201).json(await s.create(req.body));}catch(e){next(e);} }
async function changeEstado(req,res,next){ try{res.json(await s.changeEstado(req.params.id, req.body.estado));}catch(e){next(e);} }

module.exports = { list, create, changeEstado };
