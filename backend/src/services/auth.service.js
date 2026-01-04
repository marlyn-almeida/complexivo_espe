// src/services/auth.service.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const repo = require("../repositories/auth.repo");

function pickActiveRole(roles, desiredActiveRole) {
  if (!Array.isArray(roles) || roles.length === 0) return null;
  if (desiredActiveRole && roles.includes(desiredActiveRole)) return desiredActiveRole;
  return roles[0]; // fallback
}

async function login({ nombre_usuario, password, activeRole }) {
  const doc = await repo.findDocenteForLoginByUsername(nombre_usuario);
  if (!doc || Number(doc.estado) !== 1) {
    const e = new Error("Credenciales inválidas");
    e.status = 401;
    throw e;
  }

  const ok = await bcrypt.compare(password, doc.password);
  if (!ok) {
    const e = new Error("Credenciales inválidas");
    e.status = 401;
    throw e;
  }

  const roles = await repo.getRolesByDocenteId(doc.id_docente);
  if (!roles.length) {
    const e = new Error("El docente no tiene roles asignados");
    e.status = 403;
    throw e;
  }

  const effectiveRole = pickActiveRole(roles, activeRole ? Number(activeRole) : null);

  // scope (solo si rol 2)
  let scope = null;
  if (Number(effectiveRole) === 2) {
    const id_carrera = await repo.getScopeCarreraForRol2(doc.id_docente);
    if (!id_carrera) {
      const e = new Error("No tienes una carrera asignada para operar como rol 2");
      e.status = 403;
      throw e;
    }
    scope = { id_carrera: Number(id_carrera) };
  }

  // ✅ Token estándar para tu middleware
  const payload = {
    id: Number(doc.id_docente),     // IMPORTANTE: id = id_docente
    roles,
    activeRole: Number(effectiveRole),
    scope,                          // puede ser null
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });

  return {
    token,
    user: {
      id_docente: Number(doc.id_docente),
      roles,
      activeRole: Number(effectiveRole),
      scope,
    },
  };
}

module.exports = { login };
