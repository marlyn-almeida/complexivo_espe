// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

const ROLE_ID_TO_NAME = {
  1: "SUPER_ADMIN",
  2: "ADMIN",
  3: "DOCENTE",
};

function normalizeRole(r) {
  if (typeof r === "string") return r;              // "ADMIN"
  const n = Number(r);                              // 2
  return ROLE_ID_TO_NAME[n] || null;                // "ADMIN"
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Token requerido" });

  const parts = header.split(" ");
  const token = parts.length === 2 ? parts[1] : null;
  if (!token) return res.status(401).json({ message: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // roles puede venir como [1,2,3] o ["ADMIN", ...]
    const rawRoles = Array.isArray(decoded.roles) ? decoded.roles : [];
    const roles = rawRoles
      .map(normalizeRole)
      .filter(Boolean);

    // activeRole puede venir como 2 o "ADMIN"
    const rawActiveRole = decoded.activeRole ?? decoded.rol ?? null;
    const activeRole = normalizeRole(rawActiveRole);

    // Rol efectivo: si activeRole no está en roles, usa el primero
    let effectiveRole = activeRole;
    if (roles.length > 0) {
      if (!effectiveRole || !roles.includes(effectiveRole)) {
        effectiveRole = roles[0];
      }
    }

    req.user = {
      id: decoded.id,
      roles,                 // ✅ siempre strings
      activeRole: effectiveRole,
      rol: effectiveRole,    // ✅ rol efectivo string
      scope: decoded.scope ?? null,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// ✅ authorize: acepta allowRoles ["ADMIN"] (recomendado) y también [2] por compatibilidad
function authorize(allowRoles = []) {
  const allowed = (allowRoles || [])
    .map(normalizeRole)
    .filter(Boolean);

  return (req, res, next) => {
    const role = req.user?.rol ?? null;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    next();
  };
}

module.exports = { auth, authorize };
