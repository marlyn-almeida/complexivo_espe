const service = require("../services/perfil.service");

async function me(req, res, next) {
  try {
    const data = await service.me(req.user); // ✅ tu service espera user completo
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function changePassword(req, res, next) {
  try {
    const data = await service.changePassword(req.user, req.body); // ✅ tu service valida todo
    res.json(data);
  } catch (e) {
    next(e);
  }
}

module.exports = { me, changePassword };
