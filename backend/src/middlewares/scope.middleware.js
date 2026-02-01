// src/middlewares/scope.middleware.js
const docenteRepo = require("../repositories/docente.repo");

async function attachScope(req, res, next) {
  try {
    if (!req.user) return next();

    // ✅ SOLO si el rol efectivo es ADMIN (Rol 2)
    if (req.user.rol !== "ADMIN") return next();

    // ✅ NUEVO: scope basado en carrera-periodo-autORIDAD
    const scope = await docenteRepo.getScopeCarreraPeriodoForRol2(req.user.id);

    if (!scope) {
      return res.status(403).json({
        ok: false,
        message:
          "Para usar el perfil ADMIN debes estar asignado como DIRECTOR o APOYO activo en una carrera-período.",
      });
    }

    // ✅ guardamos el contexto
    req.user.scope = {
      id_carrera: scope.id_carrera,
      id_carrera_periodo: scope.id_carrera_periodo, // 👈 clave
      tipo_admin: scope.tipo_admin,
      id_periodo: scope.id_periodo ?? null,
      codigo_periodo: scope.codigo_periodo ?? null,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { attachScope };
