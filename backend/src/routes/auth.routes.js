const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const docenteRepo = require("../repositories/docente.repo");

function pickActiveRoleId(roles) {
  const ids = roles.map(r => r.id_rol);
  if (ids.includes(1)) return 1; // SUPER_ADMIN
  if (ids.includes(2)) return 2; // ADMIN
  if (ids.includes(3)) return 3; // DOCENTE
  return null;
}

function redirectByRole(activeRoleId) {
  if (activeRoleId === 1) return "/superadmin/dashboard";
  if (activeRoleId === 2) return "/admin/dashboard";
  if (activeRoleId === 3) return "/docente/dashboard";
  return "/login";
}

// POST /api/auth/login
router.post(
  "/login",
  body("username").isString().trim().notEmpty(),
  body("password").isString().notEmpty(),
  validate,
  async (req, res) => {
    const { username, password } = req.body;

    const user = await docenteRepo.findAuthByUsername(username);
    if (!user || user.estado !== 1) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // debe cambiar contraseña
    if (user.debe_cambiar_password === 1) {
      const tempToken = jwt.sign(
        { id: user.id_docente, purpose: "CHANGE_PASSWORD" },
        process.env.TEMP_JWT_SECRET,
        { expiresIn: "10m" }
      );

      return res.json({
        mustChangePassword: true,
        tempToken
      });
    }

    // ===== NUEVO: leer roles =====
    const roles = await docenteRepo.getRolesByDocenteId(user.id_docente);
    const activeRoleId = pickActiveRoleId(roles);

    if (!activeRoleId) {
      return res.status(403).json({ message: "El usuario no tiene roles activos" });
    }

    const activeRole = roles.find(r => r.id_rol === activeRoleId);

    const accessToken = jwt.sign(
      {
        id: user.id_docente,
        roles: roles.map(r => r.id_rol),
        activeRole: activeRoleId
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      mustChangePassword: false,
      accessToken,
      roles,
      activeRole,
      redirectTo: redirectByRole(activeRoleId) // opcional (te facilita el frontend)
    });
  }
);

// PATCH /api/auth/change-password
router.patch(
  "/change-password",
  body("tempToken").isString().notEmpty(),
  body("newPassword").isString().isLength({ min: 6 }),
  validate,
  async (req, res) => {
    const { tempToken, newPassword } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.TEMP_JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Token temporal inválido o expirado" });
    }

    if (decoded.purpose !== "CHANGE_PASSWORD") {
      return res.status(401).json({ message: "Token temporal no válido para este propósito" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await docenteRepo.updatePasswordAndClearFlag(decoded.id, passwordHash);

    // ===== NUEVO: emitir token completo con roles =====
    const roles = await docenteRepo.getRolesByDocenteId(decoded.id);
    const activeRoleId = pickActiveRoleId(roles);

    if (!activeRoleId) {
      return res.status(403).json({ message: "El usuario no tiene roles activos" });
    }

    const activeRole = roles.find(r => r.id_rol === activeRoleId);

    const accessToken = jwt.sign(
      {
        id: decoded.id,
        roles: roles.map(r => r.id_rol),
        activeRole: activeRoleId
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
  mustChangePassword: false,
  accessToken,
  roles,
  activeRole,
  redirectTo: redirectByRole(activeRoleId),
  __version: "LOGIN_WITH_ROLES_V2"
});

  }
);

module.exports = router;
