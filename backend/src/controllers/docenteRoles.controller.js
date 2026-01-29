const service = require("../services/docenteRoles.service");

async function getRoles(req, res, next) {
  try {
    res.json(await service.getRolesByDocenteId(req.params.id));
  } catch (e) {
    next(e);
  }
}

async function setRoles(req, res, next) {
  try {
    res.json(await service.setRolesByDocenteId(req.params.id, req.body.roleIds));
  } catch (e) {
    next(e);
  }
}

module.exports = { getRoles, setRoles };
