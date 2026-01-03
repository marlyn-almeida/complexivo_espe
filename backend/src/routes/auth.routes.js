const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const { auth } = require("../middlewares/auth.middleware"); // ✅ NUEVO

const docenteRepo = require("../repositories/docente.repo");

// ===== Helpers =====
function pickActiveRoleId(roles) {
  const ids = roles.map((r) => r.id_rol);

  // ✅ PARA MÓDULOS DIRECTOR/APOYO (ROL 2): priorizamos ADMIN
  if (ids.includes(2)) return 2; // ADMIN (Director/Apoyo)
  if (ids.includes(1)) return 1; // SUPER_ADMIN
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
    try {
      const { username, password } = req.body;

      // Buscar docente por username
      const user = await docenteRepo.findAuthByUsername(username);
      if (!user || user.estado !== 1) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      // Validar la contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      // Si debe cambiar la contraseña => token temporal
      if (user.debe_cambiar_password === 1) {
        const tempToken = jwt.sign(
          { id: user.id_docente, purpose: "CHANGE_PASSWORD" },
          process.env.TEMP_JWT_SECRET,
          { expiresIn: "10m" }
        );

        return res.json({
          mustChangePassword: true,
          tempToken,
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      // ===== Roles =====
      if (typeof docenteRepo.getRolesByDocenteId !== "function") {
        return res.status(500).json({
          message:
            "getRolesByDocenteId no está implementado/exportado en docente.repo.js",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      const roles = await docenteRepo.getRolesByDocenteId(user.id_docente);
      const activeRoleId = pickActiveRoleId(roles);

      if (!activeRoleId) {
        return res.status(403).json({
          message: "El usuario no tiene roles activos",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      const activeRole = roles.find((r) => r.id_rol === activeRoleId) || null;

      // JWT normal con roles
      const accessToken = jwt.sign(
        {
          id: user.id_docente,
          roles: roles.map((r) => r.id_rol),
          activeRole: activeRoleId,
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
        __version: "LOGIN_WITH_ROLES_V2",
      });
    } catch (err) {
      console.error("AUTH LOGIN ERROR:", err);
      return res.status(500).json({
        message: "Error interno en login",
        detail: err?.message || String(err),
        __version: "LOGIN_WITH_ROLES_V2",
      });
    }
  }
);

// ✅ NUEVO: POST /api/auth/active-role
// Permite cambiar el perfil actual (rol activo) sin volver a loguearse.
// Body: { "activeRole": 1|2|3 }
router.post(
  "/active-role",
  auth,
  body("activeRole").isInt({ min: 1 }).toInt(),
  validate,
  async (req, res) => {
    try {
      const { activeRole } = req.body;

      // Roles permitidos desde el token actual
      const roleIds = req.user?.roles ?? [];

      if (!roleIds.includes(activeRole)) {
        return res.status(403).json({
          ok: false,
          message: "No tienes permisos para usar ese rol",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      // Traer roles completos (para devolver activeRole object y lista bonita)
      const roles = await docenteRepo.getRolesByDocenteId(req.user.id);
      const activeRoleObj = roles.find((r) => r.id_rol === activeRole) || null;

      const accessToken = jwt.sign(
        {
          id: req.user.id,
          roles: roleIds,
          activeRole: activeRole,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        ok: true,
        accessToken,
        roles,
        activeRole: activeRoleObj,
        redirectTo: redirectByRole(activeRole),
        __version: "LOGIN_WITH_ROLES_V2",
      });
    } catch (err) {
      console.error("AUTH ACTIVE-ROLE ERROR:", err);
      return res.status(500).json({
        ok: false,
        message: "Error interno en active-role",
        detail: err?.message || String(err),
        __version: "LOGIN_WITH_ROLES_V2",
      });
    }
  }
);

// PATCH /api/auth/change-password  ✅ ahora con confirmPassword
router.patch(
  "/change-password",
  body("tempToken").isString().notEmpty(),
  body("newPassword").isString().isLength({ min: 6 }),
  body("confirmPassword").isString().notEmpty(),
  validate,
  async (req, res) => {
    try {
      const { tempToken, newPassword, confirmPassword } = req.body;

      if (newPassword !== confirmPassword) {
        return res.status(422).json({
          message: "Las contraseñas no coinciden",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      // Verificar token temporal
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.TEMP_JWT_SECRET);
      } catch {
        return res.status(401).json({
          message: "Token temporal inválido o expirado",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      if (decoded.purpose !== "CHANGE_PASSWORD") {
        return res.status(401).json({
          message: "Token temporal no válido para este propósito",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      // Hashear nueva contraseña + limpiar flag
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await docenteRepo.updatePasswordAndClearFlag(decoded.id, passwordHash);

      // ===== Roles para emitir accessToken completo =====
      if (typeof docenteRepo.getRolesByDocenteId !== "function") {
        return res.status(500).json({
          message:
            "getRolesByDocenteId no está implementado/exportado en docente.repo.js",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      const roles = await docenteRepo.getRolesByDocenteId(decoded.id);
      const activeRoleId = pickActiveRoleId(roles);

      if (!activeRoleId) {
        return res.status(403).json({
          message: "El usuario no tiene roles activos",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      const activeRole = roles.find((r) => r.id_rol === activeRoleId) || null;

      const accessToken = jwt.sign(
        {
          id: decoded.id,
          roles: roles.map((r) => r.id_rol),
          activeRole: activeRoleId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        accessToken,
        roles,
        activeRole,
        redirectTo: redirectByRole(activeRoleId),
        __version: "LOGIN_WITH_ROLES_V2",
      });
    } catch (err) {
      console.error("AUTH CHANGE-PASSWORD ERROR:", err);
      return res.status(500).json({
        message: "Error interno en change-password",
        detail: err?.message || String(err),
        __version: "LOGIN_WITH_ROLES_V2",
      });
    }
  }
);

module.exports = router;
