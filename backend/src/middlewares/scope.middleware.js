const scopeRepo = require("../repositories/scope.repo");

async function attachScope(req, res, next) {
  try {
    if (!req.user) return next();

    // ✅ SOLO si el rol efectivo es ADMIN
    if (req.user.rol !== "ADMIN") return next();

    const scope = await scopeRepo.getAdminScopeByDocenteId(req.user.id);

    if (!scope) {
      return res.status(403).json({
        ok: false,
        message:
          "Para usar el perfil ADMIN debes estar asignado como DIRECTOR o APOYO activo en una carrera.",
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
