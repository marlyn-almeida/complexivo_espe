// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Token requerido" });

  const parts = header.split(" ");
  const token = parts.length === 2 ? parts[1] : null;
  if (!token) return res.status(401).json({ message: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lista de roles disponibles (puede ser [])
    const roles = Array.isArray(decoded.roles) ? decoded.roles : [];

    // Rol activo (prioridad) o fallback a rol viejo
    const activeRole = decoded.activeRole ?? decoded.rol ?? null;

    // Si trae roles, valida consistencia: activeRole debe estar en roles
    // (si no, se corrige tomando el primer rol disponible)
    let effectiveRole = activeRole;
    if (roles.length > 0) {
      if (!effectiveRole || !roles.includes(effectiveRole)) {
        effectiveRole = roles[0]; // fallback seguro
      }
    }

    // user normalizado
    req.user = {
      id: decoded.id,
      roles,
      activeRole: effectiveRole,
      rol: effectiveRole, // ✅ ROL EFECTIVO
      scope: decoded.scope ?? null, // ✅ NUEVO
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// Permite acceso SOLO si el rol efectivo (activeRole) está permitido
function authorize(allowRoles = []) {
  return (req, res, next) => {
    const role = req.user?.rol ?? null;
    if (!role || !allowRoles.includes(role)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
  };
}

module.exports = { auth, authorize };
