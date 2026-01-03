const scopeRepo = require("../repositories/scope.repo");

async function attachScope(req, res, next) {
  try {
    if (!req.user) return next();

    // Solo rol 2 (ADMIN director/apoyo)
    if (Number(req.user.rol) !== 2) return next();

    const scope = await scopeRepo.getAdminScopeByDocenteId(req.user.id);

    if (!scope) {
      return res.status(403).json({
        ok: false,
        message:
          "No tienes una carrera asignada como Director o Docente de apoyo (activo).",
      });
    }

    req.user.scope = {
      id_carrera: scope.id_carrera,
      tipo_admin: scope.tipo_admin,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { attachScope };
