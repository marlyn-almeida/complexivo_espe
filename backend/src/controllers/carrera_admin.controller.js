// src/controllers/carrera_admin.controller.js
const service = require("../services/carrera_admin.service");

async function getAdmins(req, res, next) {
  try {
    const data = await service.getAdmins(req.params.id);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function setAdmins(req, res, next) {
  try {
    const data = await service.setAdmins(req.params.id, req.body);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

module.exports = { getAdmins, setAdmins };
