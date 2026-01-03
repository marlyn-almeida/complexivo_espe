const service = require("../services/estudiante.service");

async function list(req, res, next) { try { res.json(await service.list(req.query, req.user)); } catch (e) { next(e); } }
async function get(req, res, next) { try { res.json(await service.get(req.params.id, req.user)); } catch (e) { next(e); } }
async function create(req, res, next) { try { res.status(201).json(await service.create(req.body, req.user)); } catch (e) { next(e); } }
async function update(req, res, next) { try { res.json(await service.update(req.params.id, req.body, req.user)); } catch (e) { next(e); } }
async function changeEstado(req, res, next) { try { res.json(await service.changeEstado(req.params.id, req.body.estado, req.user)); } catch (e) { next(e); } }

module.exports = { list, get, create, update, changeEstado };
