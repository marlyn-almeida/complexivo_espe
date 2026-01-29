// src/routes/auth.routes.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const { auth } = require("../middlewares/auth.middleware");
const docenteRepo = require("../repositories/docente.repo");

// ===== Helpers =====
function pickActiveRoleId(rolesRows, desiredActiveRoleId) {
  if (!Array.isArray(rolesRows) || rolesRows.length === 0) return null;
  const ids = rolesRows.map((r) => Number(r.id_rol)).filter(Boolean);

  if (desiredActiveRoleId && ids.includes(Number(desiredActiveRoleId))) {
    return Number(desiredActiveRoleId);
  }
  if (ids.length === 1) return ids[0];
  return ids[0];
}

function redirectByRole(activeRoleId) {
  if (activeRoleId === 1) return "/superadmin/dashboard";
  if (activeRoleId === 2) return "/admin/dashboard";
  if (activeRoleId === 3) return "/docente/dashboard";
  return "/login";
}

async function buildScopeForRole(activeRoleId, id_docente) {
  if (activeRoleId !== 2) return null;
  const scopeRow = await docenteRepo.getScopeCarreraForRol2(id_docente);
  if (!scopeRow?.id_carrera) return null;
  return { id_carrera: Number(scopeRow.id_carrera) };
}

/**
 * ✅ Validador de password:
 * - si debe_cambiar_password=1 => password guardado en PLANO (cédula) -> comparar directo
 * - si debe_cambiar_password=0 => password guardado en HASH -> bcrypt.compare
 */
async function validatePassword({ inputPassword, dbPassword, mustChangeFlag }) {
  const pwd = String(inputPassword || "");
  const stored = String(dbPassword || "");

  if (Number(mustChangeFlag) === 1) {
    // ✅ primer login con cédula en plano
    return pwd === stored;
  }

  // ✅ después de cambiar contraseña, debe estar hasheada
  return bcrypt.compare(pwd, stored);
}

// POST /api/auth/login
router.post(
  "/login",
  body("username").isString().trim().notEmpty(),
  body("password").isString().notEmpty(),
  body("activeRole").optional().isInt({ min: 1 }).toInt(),
  validate,
  async (req, res) => {
    try {
      const { username, password, activeRole } = req.body;

      const user = await docenteRepo.findAuthByUsername(username);
      if (!user || Number(user.estado) !== 1) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      const ok = await validatePassword({
        inputPassword: password,
        dbPassword: user.password,
        mustChangeFlag: user.debe_cambiar_password,
      });

      if (!ok) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      // ✅ si debe cambiar contraseña -> token temporal
      if (Number(user.debe_cambiar_password) === 1) {
        const tempToken = jwt.sign(
          { id: Number(user.id_docente), purpose: "CHANGE_PASSWORD" },
          process.env.TEMP_JWT_SECRET,
          { expiresIn: "10m" }
        );

        return res.json({
          mustChangePassword: true,
          tempToken,
          __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
        });
      }

      const rolesRows = await docenteRepo.getRolesByDocenteId(user.id_docente);
      const activeRoleId = pickActiveRoleId(rolesRows, activeRole);

      if (!activeRoleId) {
        return res.status(403).json({
          message: "El usuario no tiene roles activos",
          __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
        });
      }

      const mustChooseRole = rolesRows.length > 1 && !activeRole;
      const scope = await buildScopeForRole(activeRoleId, user.id_docente);

      const accessToken = jwt.sign(
        {
          id: Number(user.id_docente),
          roles: rolesRows.map((r) => Number(r.id_rol)),
          activeRole: Number(activeRoleId),
          scope,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      const activeRoleObj =
        rolesRows.find((r) => Number(r.id_rol) === Number(activeRoleId)) || null;

      return res.json({
        mustChangePassword: false,
        mustChooseRole,
        accessToken,
        roles: rolesRows,
        activeRole: activeRoleObj,
        scope,
        redirectTo: redirectByRole(activeRoleId),
        __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
      });
    } catch (err) {
      console.error("AUTH LOGIN ERROR:", err);
      return res.status(500).json({
        message: "Error interno en login",
        detail: err?.message || String(err),
        __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
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

      const rolesRows = await docenteRepo.getRolesByDocenteId(req.user.id);
      const roleIds = rolesRows.map((r) => Number(r.id_rol));

      if (!roleIds.includes(Number(activeRole))) {
        return res.status(403).json({
          ok: false,
          message: "No tienes permisos para usar ese rol",
          __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
        });
      }

      const scope = await buildScopeForRole(Number(activeRole), req.user.id);

      const accessToken = jwt.sign(
        {
          id: Number(req.user.id),
          roles: roleIds,
          activeRole: Number(activeRole),
          scope,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      const activeRoleObj =
        rolesRows.find((r) => Number(r.id_rol) === Number(activeRole)) || null;

      return res.json({
        ok: true,
        accessToken,
        roles: rolesRows,
        activeRole: activeRoleObj,
        scope,
        redirectTo: redirectByRole(Number(activeRole)),
        __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
      });
    } catch (err) {
      console.error("AUTH ACTIVE-ROLE ERROR:", err);
      return res.status(500).json({
        ok: false,
        message: "Error interno en active-role",
        detail: err?.message || String(err),
        __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
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
          __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.TEMP_JWT_SECRET);
      } catch {
        return res.status(401).json({
          message: "Token temporal inválido o expirado",
          __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
        });
      }

      if (decoded.purpose !== "CHANGE_PASSWORD") {
        return res.status(401).json({
          message: "Token temporal no válido para este propósito",
          __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
        });
      }

      // ✅ aquí sí hasheamos
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await docenteRepo.updatePasswordAndClearFlag(Number(decoded.id), passwordHash);

      const rolesRows = await docenteRepo.getRolesByDocenteId(Number(decoded.id));
      const activeRoleId = pickActiveRoleId(rolesRows, null);

      if (!activeRoleId) {
        return res.status(403).json({
          message: "El usuario no tiene roles activos",
          __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
        });
      }

      const scope = await buildScopeForRole(activeRoleId, Number(decoded.id));

      const accessToken = jwt.sign(
        {
          id: Number(decoded.id),
          roles: rolesRows.map((r) => Number(r.id_rol)),
          activeRole: Number(activeRoleId),
          scope,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      const activeRoleObj =
        rolesRows.find((r) => Number(r.id_rol) === Number(activeRoleId)) || null;

      return res.json({
        accessToken,
        roles: rolesRows,
        activeRole: activeRoleObj,
        scope,
        redirectTo: redirectByRole(activeRoleId),
        __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
      });
    } catch (err) {
      console.error("AUTH CHANGE-PASSWORD ERROR:", err);
      return res.status(500).json({
        message: "Error interno en change-password",
        detail: err?.message || String(err),
        __version: "LOGIN_WITH_ROLES_V3_PLAIN_CEDULA",
      });
    }
  }
);

module.exports = router;
