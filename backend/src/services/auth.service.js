const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const repo = require("../repositories/auth.repo");

// ===== Helpers =====
function pickActiveRoleId(roleIds, desiredActiveRoleId) {
  if (!Array.isArray(roleIds) || roleIds.length === 0) return null;

  const ids = roleIds.map((n) => Number(n)).filter(Boolean);

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
  if (Number(activeRoleId) !== 2) return null;

  const id_carrera = await repo.getScopeCarreraForRol2(Number(id_docente));
  if (!id_carrera) return null;

  return { id_carrera: Number(id_carrera) };
}

/**
 * ✅ LOGIN con regla:
 * - debe_cambiar_password=1 => password en BD es PLANO (cédula) => comparar string
 * - debe_cambiar_password=0 => password en BD es HASH => bcrypt.compare
 */
async function login({ nombre_usuario, password, activeRole }) {
  const doc = await repo.findDocenteForLoginByUsername(nombre_usuario);
  if (!doc || Number(doc.estado) !== 1) {
    const e = new Error("Credenciales inválidas");
    e.status = 401;
    throw e;
  }

  const passInput = String(password || "").trim();
  if (!passInput) {
    const e = new Error("Password requerido");
    e.status = 422;
    throw e;
  }

  const mustChange = Number(doc.debe_cambiar_password) === 1;

  let ok = false;
  if (mustChange) {
    // ✅ PASSWORD PLANO (cédula)
    ok = passInput === String(doc.password || "");
  } else {
    // ✅ PASSWORD HASH
    ok = await bcrypt.compare(passInput, String(doc.password || ""));
  }

  if (!ok) {
    const e = new Error("Credenciales inválidas");
    e.status = 401;
    throw e;
  }

  // Si debe cambiar la contraseña => token temporal
  if (mustChange) {
    const tempToken = jwt.sign(
      { id: Number(doc.id_docente), purpose: "CHANGE_PASSWORD" },
      process.env.TEMP_JWT_SECRET,
      { expiresIn: "10m" }
    );

    return {
      mustChangePassword: true,
      tempToken,
      __version: "LOGIN_WITH_ROLES_V2",
    };
  }

  const roles = await repo.getRolesByDocenteId(Number(doc.id_docente));
  if (!roles.length) {
    const e = new Error("El docente no tiene roles asignados");
    e.status = 403;
    throw e;
  }

  const activeRoleId = pickActiveRoleId(roles, activeRole ? Number(activeRole) : null);

  if (!activeRoleId) {
    const e = new Error("El usuario no tiene roles activos");
    e.status = 403;
    throw e;
  }

  const mustChooseRole = roles.length > 1 && !activeRole;

  const scope = await buildScopeForRole(activeRoleId, Number(doc.id_docente));

  const accessToken = jwt.sign(
    {
      id: Number(doc.id_docente),
      roles: roles.map((r) => Number(r)),
      activeRole: Number(activeRoleId),
      scope,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return {
    mustChangePassword: false,
    mustChooseRole,
    accessToken,
    roles: roles.map((id_rol) => ({ id_rol: Number(id_rol) })), // para que tu front siga igual si esperaba objetos
    activeRole: { id_rol: Number(activeRoleId) },
    scope,
    redirectTo: redirectByRole(Number(activeRoleId)),
    __version: "LOGIN_WITH_ROLES_V2",
  };
}

/**
 * ✅ Cambiar rol activo: genera nuevo accessToken con scope
 */
async function setActiveRole(user, { activeRole }) {
  const id_docente = Number(user?.id);
  if (!id_docente) {
    const e = new Error("Token inválido");
    e.status = 401;
    throw e;
  }

  const roles = await repo.getRolesByDocenteId(id_docente);
  const roleIds = roles.map(Number);

  if (!roleIds.includes(Number(activeRole))) {
    const e = new Error("No tienes permisos para usar ese rol");
    e.status = 403;
    throw e;
  }

  const scope = await buildScopeForRole(Number(activeRole), id_docente);

  const accessToken = jwt.sign(
    {
      id: id_docente,
      roles: roleIds,
      activeRole: Number(activeRole),
      scope,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return {
    ok: true,
    accessToken,
    roles: roleIds.map((id_rol) => ({ id_rol })),
    activeRole: { id_rol: Number(activeRole) },
    scope,
    redirectTo: redirectByRole(Number(activeRole)),
    __version: "LOGIN_WITH_ROLES_V2",
  };
}

/**
 * ✅ change-password:
 * - valida tempToken
 * - HASHEA newPassword
 * - guarda hash y pone debe_cambiar_password=0
 * - devuelve accessToken normal
 */
async function changePassword({ tempToken, newPassword, confirmPassword }) {
  if (String(newPassword) !== String(confirmPassword)) {
    const e = new Error("Las contraseñas no coinciden");
    e.status = 422;
    throw e;
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.TEMP_JWT_SECRET);
  } catch {
    const e = new Error("Token temporal inválido o expirado");
    e.status = 401;
    throw e;
  }

  if (decoded.purpose !== "CHANGE_PASSWORD") {
    const e = new Error("Token temporal no válido para este propósito");
    e.status = 401;
    throw e;
  }

  const id_docente = Number(decoded.id);
  if (!id_docente) {
    const e = new Error("Token temporal inválido");
    e.status = 401;
    throw e;
  }

  const hash = await bcrypt.hash(String(newPassword).trim(), 10);
  await repo.updatePasswordAndClearFlag(id_docente, hash);

  const roles = await repo.getRolesByDocenteId(id_docente);
  const activeRoleId = pickActiveRoleId(roles, null);

  if (!activeRoleId) {
    const e = new Error("El usuario no tiene roles activos");
    e.status = 403;
    throw e;
  }

  const scope = await buildScopeForRole(activeRoleId, id_docente);

  const accessToken = jwt.sign(
    {
      id: id_docente,
      roles: roles.map((r) => Number(r)),
      activeRole: Number(activeRoleId),
      scope,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return {
    accessToken,
    roles: roles.map((id_rol) => ({ id_rol: Number(id_rol) })),
    activeRole: { id_rol: Number(activeRoleId) },
    scope,
    redirectTo: redirectByRole(Number(activeRoleId)),
    __version: "LOGIN_WITH_ROLES_V2",
  };
}

module.exports = { login, setActiveRole, changePassword };
