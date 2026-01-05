// src/routes/auth.routes.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const { auth } = require("../middlewares/auth.middleware");

const docenteRepo = require("../repositories/docente.repo");

// ===== Helpers =====
function pickActiveRoleId(roles, desiredActiveRoleId) {
  if (!Array.isArray(roles) || roles.length === 0) return null;

  const ids = roles.map((r) => Number(r.id_rol)).filter(Boolean);

  // ✅ si el frontend manda un rol deseado y existe, se usa
  if (desiredActiveRoleId && ids.includes(Number(desiredActiveRoleId))) {
    return Number(desiredActiveRoleId);
  }

  // ✅ si solo hay uno, ese
  if (ids.length === 1) return ids[0];

  // ✅ si hay varios, NO forzamos ADMIN: usamos el primero que venga
  return ids[0];
}

function redirectByRole(activeRoleId) {
  if (activeRoleId === 1) return "/superadmin/dashboard";
  if (activeRoleId === 2) return "/admin/dashboard";
  if (activeRoleId === 3) return "/docente/dashboard";
  return "/login";
}

// scope solo para rol 2 (admin/director/apoyo)
async function buildScopeForRole(activeRoleId, id_docente) {
  if (activeRoleId !== 2) return null;

  if (typeof docenteRepo.getScopeCarreraForRol2 !== "function") {
    return null;
  }

  const id_carrera = await docenteRepo.getScopeCarreraForRol2(id_docente);
  if (!id_carrera) return null;

  return { id_carrera: Number(id_carrera) };
}

// POST /api/auth/login
router.post(
  "/login",
  body("username").isString().trim().notEmpty(),
  body("password").isString().notEmpty(),
  // ✅ opcional: permite entrar con un perfil específico
  body("activeRole").optional().isInt({ min: 1 }).toInt(),
  validate,
  async (req, res) => {
    try {
      const { username, password, activeRole } = req.body;

      const user = await docenteRepo.findAuthByUsername(username);
      if (!user || user.estado !== 1) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

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

      if (typeof docenteRepo.getRolesByDocenteId !== "function") {
        return res.status(500).json({
          message:
            "getRolesByDocenteId no está implementado/exportado en docente.repo.js",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      const roles = await docenteRepo.getRolesByDocenteId(user.id_docente);

      const activeRoleId = pickActiveRoleId(roles, activeRole);

      if (!activeRoleId) {
        return res.status(403).json({
          message: "El usuario no tiene roles activos",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      const activeRoleObj =
        roles.find((r) => Number(r.id_rol) === Number(activeRoleId)) || null;

      // ✅ si tiene más de 1 rol y NO envió activeRole, que el frontend elija
      const mustChooseRole = roles.length > 1 && !activeRole;

      const scope = await buildScopeForRole(activeRoleId, user.id_docente);

      const accessToken = jwt.sign(
        {
          id: user.id_docente,
          roles: roles.map((r) => Number(r.id_rol)),
          activeRole: Number(activeRoleId),
          scope,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        mustChangePassword: false,
        mustChooseRole, // ✅ NUEVO
        accessToken,
        roles,
        activeRole: activeRoleObj,
        scope,
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

// POST /api/auth/active-role
router.post(
  "/active-role",
  auth,
  body("activeRole").isInt({ min: 1 }).toInt(),
  validate,
  async (req, res) => {
    try {
      const { activeRole } = req.body;

      // OJO: en req.user.roles ya llegan strings por tu auth.middleware,
      // pero el token original trae ids numéricos.
      // Para no complicar, validamos contra el token decodificado original:
      // Como tu auth.middleware normaliza a strings, aquí validamos por objeto roles de DB.
      const roles = await docenteRepo.getRolesByDocenteId(req.user.id);
      const roleIds = roles.map((r) => Number(r.id_rol));

      if (!roleIds.includes(Number(activeRole))) {
        return res.status(403).json({
          ok: false,
          message: "No tienes permisos para usar ese rol",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      const activeRoleObj =
        roles.find((r) => Number(r.id_rol) === Number(activeRole)) || null;

      const scope = await buildScopeForRole(Number(activeRole), req.user.id);

      const accessToken = jwt.sign(
        {
          id: req.user.id,
          roles: roleIds,
          activeRole: Number(activeRole),
          scope,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        ok: true,
        accessToken,
        roles,
        activeRole: activeRoleObj,
        scope,
        redirectTo: redirectByRole(Number(activeRole)),
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

// PATCH /api/auth/change-password
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

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await docenteRepo.updatePasswordAndClearFlag(decoded.id, passwordHash);

      if (typeof docenteRepo.getRolesByDocenteId !== "function") {
        return res.status(500).json({
          message:
            "getRolesByDocenteId no está implementado/exportado en docente.repo.js",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      const roles = await docenteRepo.getRolesByDocenteId(decoded.id);

      // ✅ NO forzamos ADMIN tampoco aquí
      const activeRoleId = pickActiveRoleId(roles, null);

      if (!activeRoleId) {
        return res.status(403).json({
          message: "El usuario no tiene roles activos",
          __version: "LOGIN_WITH_ROLES_V2",
        });
      }

      const activeRoleObj =
        roles.find((r) => Number(r.id_rol) === Number(activeRoleId)) || null;

      const scope = await buildScopeForRole(activeRoleId, decoded.id);

      const accessToken = jwt.sign(
        {
          id: decoded.id,
          roles: roles.map((r) => Number(r.id_rol)),
          activeRole: Number(activeRoleId),
          scope,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        accessToken,
        roles,
        activeRole: activeRoleObj,
        scope,
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
