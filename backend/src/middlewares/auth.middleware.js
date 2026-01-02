const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Token requerido" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Soporta tokens nuevos (roles/activeRole) y tokens viejos (rol)
    req.user = {
      id: decoded.id,
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      activeRole: decoded.activeRole ?? decoded.rol ?? null,
      rol: decoded.rol ?? decoded.activeRole ?? null,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// Permite por roles por ID (ej: 1,2,3)
function authorize(allowRoles = []) {
  return (req, res, next) => {
    const roles = req.user?.roles ?? [];
    const activeRole = req.user?.activeRole ?? req.user?.rol ?? null;

    // Si el token trae lista de roles
    if (roles.length > 0) {
      const ok = roles.some((r) => allowRoles.includes(r));
      if (!ok) return res.status(403).json({ message: "Acceso denegado" });
      return next();
    }

    // Fallback tokens viejos
    if (!allowRoles.includes(activeRole)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
  };
}

module.exports = { auth, authorize };
