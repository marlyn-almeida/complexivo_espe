// src/services/docente.service.js
const bcrypt = require("bcryptjs");
const repo = require("../repositories/docente.repo");

function isAdmin(user) {
  return user?.rol === "ADMIN";
}

function isSuperAdmin(user) {
  return user?.rol === "SUPER_ADMIN";
}

// ✅ Resuelve carrera para asignación tipo DOCENTE
async function resolveCarreraIdForCreate(payload, user) {
  // ADMIN: siempre por scope (esto se mantiene, porque ADMIN crea docentes para SU carrera)
  if (isAdmin(user)) {
    const carreraId = Number(user?.scope?.id_carrera);
    if (!carreraId) {
      const err = new Error("Scope inválido: no se encontró id_carrera en el token");
      err.status = 403;
      throw err;
    }
    return carreraId;
  }

  // SUPER_ADMIN: puede venir por payload (Formato B)
  if (isSuperAdmin(user)) {
    const idCarrera = payload.id_carrera ? Number(payload.id_carrera) : null;
    const codigoCarrera = payload.codigo_carrera ? String(payload.codigo_carrera).trim() : null;

    if (!idCarrera && !codigoCarrera) return null; // no asigna carrera

    if (idCarrera) {
      const c = await repo.findCarreraById(idCarrera);
      if (!c) {
        const err = new Error("Carrera no encontrada (id_carrera inválido)");
        err.status = 422;
        throw err;
      }
      if (Number(c.estado) !== 1) {
        const err = new Error("Carrera inactiva: no se puede asignar docentes a una carrera desactivada");
        err.status = 422;
        throw err;
      }

      // Si también viene código, debe coincidir
      if (codigoCarrera) {
        if (String(c.codigo_carrera).trim() !== codigoCarrera) {
          const err = new Error("id_carrera y codigo_carrera no coinciden");
          err.status = 422;
          throw err;
        }
      }

      return Number(c.id_carrera);
    }

    // Solo código
    if (codigoCarrera) {
      const c = await repo.findCarreraByCodigo(codigoCarrera);
      if (!c) {
        const err = new Error("Carrera no encontrada (codigo_carrera inválido)");
        err.status = 422;
        throw err;
      }
      if (Number(c.estado) !== 1) {
        const err = new Error("Carrera inactiva: no se puede asignar docentes a una carrera desactivada");
        err.status = 422;
        throw err;
      }
      return Number(c.id_carrera);
    }
  }

  // Otros roles: no asignan carrera aquí
  return null;
}

async function list(query = {}, user) {
  const includeInactive = Boolean(query.includeInactive);
  const q = query.q || "";
  const page = query.page || 1;
  const limit = query.limit || 50;

  // ✅ CAMBIO: YA NO FILTRAMOS POR SCOPE PARA ADMIN
  // ✅ Ahora el filtro por carrera es OPCIONAL y viene desde la UI:
  // GET /docentes?id_carrera=5
  const carreraFilterId = query.id_carrera ? Number(query.id_carrera) : null;

  // Si viene algo raro (NaN) lo ignoramos
  const scopeCarreraId = Number.isFinite(carreraFilterId) && carreraFilterId > 0 ? carreraFilterId : null;

  return repo.findAll({ includeInactive, q, page, limit, scopeCarreraId });
}

async function get(id, user) {
  const doc = await repo.findById(id);
  if (!doc) {
    const err = new Error("Docente no encontrado");
    err.status = 404;
    throw err;
  }

  // ✅ CAMBIO: si ADMIN ya puede ver TODOS, no bloqueamos por carrera aquí.
  // (Si tú quisieras restringir el detalle, aquí se volvería a poner.)
  return doc;
}

async function create(payload, user) {
  const byInst = await repo.findByInstitucional(payload.id_institucional_docente);
  if (byInst) {
    const err = new Error("Ya existe un docente con ese ID institucional");
    err.status = 409;
    throw err;
  }

  const byCedula = await repo.findByCedula(payload.cedula);
  if (byCedula) {
    const err = new Error("Ya existe un docente con esa cédula");
    err.status = 409;
    throw err;
  }

  const byUser = await repo.findByUsername(payload.nombre_usuario);
  if (byUser) {
    const err = new Error("Ya existe un docente con ese nombre de usuario");
    err.status = 409;
    throw err;
  }

  let passwordPlano = payload.password;
  if (!passwordPlano || !passwordPlano.trim()) passwordPlano = payload.nombre_usuario;

  if (passwordPlano.trim().length < 6) {
    const err = new Error("Password inicial mínimo 6 caracteres (puede ser el username si cumple)");
    err.status = 422;
    throw err;
  }

  // ✅ Resolver carrera para asignación (Formato B)
  const carreraIdToAssign = await resolveCarreraIdForCreate(payload, user);

  const passwordHash = await bcrypt.hash(passwordPlano, 10);

  const created = await repo.create({
    id_institucional_docente: payload.id_institucional_docente,
    cedula: payload.cedula,
    nombres_docente: payload.nombres_docente,
    apellidos_docente: payload.apellidos_docente,
    correo_docente: payload.correo_docente ?? null,
    telefono_docente: payload.telefono_docente ?? null,
    nombre_usuario: payload.nombre_usuario,
    passwordHash,
  });

  // ✅ ROL DOCENTE automático (id_rol=3)
  await repo.assignRolToDocente({
    id_rol: 3,
    id_docente: Number(created.id_docente),
  });

  // ✅ Asignación carrera_docente como DOCENTE
  if (carreraIdToAssign) {
    await repo.assignDocenteToCarrera({
      id_carrera: Number(carreraIdToAssign),
      id_docente: Number(created.id_docente),
      tipo_admin: "DOCENTE",
    });
  }

  return created;
}

async function update(id, payload, user) {
  await get(id, user);

  const byInst = await repo.findByInstitucional(payload.id_institucional_docente);
  if (byInst && Number(byInst.id_docente) !== Number(id)) {
    const err = new Error("Ya existe un docente con ese ID institucional");
    err.status = 409;
    throw err;
  }

  const byCedula = await repo.findByCedula(payload.cedula);
  if (byCedula && Number(byCedula.id_docente) !== Number(id)) {
    const err = new Error("Ya existe un docente con esa cédula");
    err.status = 409;
    throw err;
  }

  const byUser = await repo.findByUsername(payload.nombre_usuario);
  if (byUser && Number(byUser.id_docente) !== Number(id)) {
    const err = new Error("Ya existe un docente con ese nombre de usuario");
    err.status = 409;
    throw err;
  }

  return repo.update(id, {
    id_institucional_docente: payload.id_institucional_docente,
    cedula: payload.cedula,
    nombres_docente: payload.nombres_docente,
    apellidos_docente: payload.apellidos_docente,
    correo_docente: payload.correo_docente ?? null,
    telefono_docente: payload.telefono_docente ?? null,
    nombre_usuario: payload.nombre_usuario,
  });
}

async function changeEstado(id, estado, user) {
  await get(id, user);
  return repo.setEstado(id, estado);
}

/**
 * ✅ NUEVO: asignar / desasignar rol SUPER_ADMIN (id_rol=1)
 * Solo lo puede hacer un SUPER_ADMIN.
 *
 * payload: { enabled: boolean }
 */
async function setSuperAdmin(id, payload, user) {
  if (!isSuperAdmin(user)) {
    const err = new Error("Acceso denegado: solo SUPER_ADMIN puede asignar/desasignar este rol");
    err.status = 403;
    throw err;
  }

  const targetId = Number(id);
  if (!Number.isFinite(targetId) || targetId < 1) {
    const err = new Error("id_docente inválido");
    err.status = 422;
    throw err;
  }

  // Debe existir el docente
  const doc = await repo.findById(targetId);
  if (!doc) {
    const err = new Error("Docente no encontrado");
    err.status = 404;
    throw err;
  }

  const enabled = Boolean(payload?.enabled);

  // ✅ Recomendado: evitar que un super admin se quite a sí mismo
  if (!enabled && Number(user?.id) === targetId) {
    const err = new Error("No puedes desasignarte a ti mismo el rol SUPER_ADMIN");
    err.status = 422;
    throw err;
  }

  await repo.setRolEstado({
    id_rol: 1,
    id_docente: targetId,
    estado: enabled ? 1 : 0,
  });

  // opcional: devolver flag para UI
  const isNow = await repo.hasRol({ id_rol: 1, id_docente: targetId });

  return {
    ok: true,
    id_docente: targetId,
    super_admin: isNow ? 1 : 0,
  };
}

module.exports = {
  list,
  get,
  create,
  update,
  changeEstado,
  setSuperAdmin,
};
