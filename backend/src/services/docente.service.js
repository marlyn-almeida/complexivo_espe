// src/services/docente.service.js
const repo = require("../repositories/docente.repo");

function isAdmin(user) {
  return user?.rol === "ADMIN";
}
function isSuperAdmin(user) {
  return user?.rol === "SUPER_ADMIN";
}

// ✅ Resuelve carrera para asignación tipo DOCENTE (opcional)
async function resolveCarreraIdForCreate(payload, user) {
  if (isAdmin(user)) {
    const carreraId = Number(user?.scope?.id_carrera);
    if (!carreraId) {
      const err = new Error("Scope inválido: no se encontró id_carrera en el token");
      err.status = 403;
      throw err;
    }
    return carreraId;
  }

  if (isSuperAdmin(user)) {
    const idCarrera = payload.id_carrera ? Number(payload.id_carrera) : null;
    const codigoCarrera = payload.codigo_carrera ? String(payload.codigo_carrera).trim() : null;

    if (!idCarrera && !codigoCarrera) return null;

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
      if (codigoCarrera && String(c.codigo_carrera).trim() !== codigoCarrera) {
        const err = new Error("id_carrera y codigo_carrera no coinciden");
        err.status = 422;
        throw err;
      }
      return Number(c.id_carrera);
    }

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

  return null;
}

// ✅ CORREO flexible: .ec o .com
function ensureCorreoFlexible(correo) {
  const mail = String(correo || "").trim().toLowerCase();

  if (!mail) {
    const err = new Error("El correo es obligatorio");
    err.status = 422;
    throw err;
  }

  // formato básico
  if (!/^\S+@\S+\.\S+$/.test(mail)) {
    const err = new Error("Correo no válido");
    err.status = 422;
    throw err;
  }

  // solo .ec o .com
  if (!/\.(ec|com)$/i.test(mail)) {
    const err = new Error("El correo debe terminar en .ec o .com");
    err.status = 422;
    throw err;
  }

  return mail;
}

async function list(query = {}, user) {
  const includeInactive = Boolean(query.includeInactive);
  const q = query.q || "";
  const page = query.page || 1;
  const limit = query.limit || 50;

  const id_carrera =
    query.id_carrera !== undefined && query.id_carrera !== null && String(query.id_carrera).trim() !== ""
      ? Number(query.id_carrera)
      : null;

  const id_departamento =
    query.id_departamento !== undefined && query.id_departamento !== null && String(query.id_departamento).trim() !== ""
      ? Number(query.id_departamento)
      : null;

  return repo.findAll({ includeInactive, q, page, limit, id_carrera, id_departamento });
}

async function get(id, user) {
  const doc = await repo.findById(id);
  if (!doc) {
    const err = new Error("Docente no encontrado");
    err.status = 404;
    throw err;
  }

  if (isAdmin(user)) {
    const carreraId = Number(user?.scope?.id_carrera);
    if (!carreraId) {
      const err = new Error("Scope inválido: no se encontró id_carrera en el token");
      err.status = 403;
      throw err;
    }

    const ok = await repo.isDocenteInCarrera(Number(id), carreraId);
    if (!ok) {
      const err = new Error("Acceso denegado: el docente no pertenece a tu carrera");
      err.status = 403;
      throw err;
    }
  }

  return doc;
}

async function create(payload, user) {
  // unicidad
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

  // correo obligatorio + .ec/.com
  const correo = ensureCorreoFlexible(payload.correo_docente);

  // departamento obligatorio
  const depId = Number(payload.id_departamento);
  if (!Number.isFinite(depId) || depId < 1) {
    const err = new Error("id_departamento es obligatorio y debe ser un entero válido");
    err.status = 422;
    throw err;
  }

  // ✅ password inicial = cédula (PLANO) y obliga cambio
  const cedulaPlano = String(payload.cedula || "").trim();
  if (cedulaPlano.length < 6) {
    const err = new Error("La cédula es inválida para usar como password inicial (mínimo 6 caracteres)");
    err.status = 422;
    throw err;
  }

  // ✅ carrera opcional
  const carreraIdToAssign = await resolveCarreraIdForCreate(payload, user);

  // ✅ IMPORTANTE: aquí se manda passwordPlano (PLANO)
  const created = await repo.create({
    id_institucional_docente: payload.id_institucional_docente,
    id_departamento: depId,
    cedula: payload.cedula,
    nombres_docente: payload.nombres_docente,
    apellidos_docente: payload.apellidos_docente,
    correo_docente: correo,
    telefono_docente: payload.telefono_docente ?? null,
    nombre_usuario: payload.nombre_usuario,

    passwordPlano: cedulaPlano, // ✅ SE GUARDA EN PLANO (primera vez)
    debe_cambiar_password: 1, // ✅ fuerza cambio (si tu repo lo usa internamente)
  });

  // rol DOCENTE automático
  await repo.assignRolToDocente({
    id_rol: 3,
    id_docente: Number(created.id_docente),
  });

  // carrera_docente si se decide asignar
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

  const correo = ensureCorreoFlexible(payload.correo_docente);

  const depId = Number(payload.id_departamento);
  if (!Number.isFinite(depId) || depId < 1) {
    const err = new Error("id_departamento es obligatorio y debe ser un entero válido");
    err.status = 422;
    throw err;
  }

  const byCorreo = await repo.findByCorreo(correo);
  if (byCorreo && Number(byCorreo.id_docente) !== Number(id)) {
    const err = new Error("Ya existe un docente con ese correo");
    err.status = 409;
    throw err;
  }

  // ✅ NO se actualiza password aquí
  return repo.update(id, {
    id_institucional_docente: payload.id_institucional_docente,
    id_departamento: depId,
    cedula: payload.cedula,
    nombres_docente: payload.nombres_docente,
    apellidos_docente: payload.apellidos_docente,
    correo_docente: correo,
    telefono_docente: payload.telefono_docente ?? null,
    nombre_usuario: payload.nombre_usuario,
  });
}

async function changeEstado(id, estado, user) {
  await get(id, user);
  return repo.setEstado(id, estado);
}

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

  const doc = await repo.findById(targetId);
  if (!doc) {
    const err = new Error("Docente no encontrado");
    err.status = 404;
    throw err;
  }

  const enabled = Boolean(payload?.enabled);

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

  const isNow = await repo.hasRol({ id_rol: 1, id_docente: targetId });

  return {
    ok: true,
    id_docente: targetId,
    super_admin: isNow ? 1 : 0,
  };
}

// =========================
// IMPORT MASIVO DOCENTES
// =========================
async function importBulk({ id_departamento, rows }, user) {
  const depId = Number(id_departamento);

  if (!Number.isFinite(depId) || depId < 1) {
    const err = new Error("Departamento inválido");
    err.status = 422;
    throw err;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    const err = new Error("Debes enviar filas para importar.");
    err.status = 422;
    throw err;
  }

  const resultado = {
    ok: true,
    resumen: {
      total: rows.length,
      importados: 0,
      omitidos: 0,
    },
    detalles: {
      importados: [], // [{ fila, id_institucional_docente, cedula, nombre_usuario }]
      omitidos: [], // [{ fila, motivo, id_institucional_docente, cedula, nombre_usuario }]
    },
  };

  function nombrePersona(r) {
    const ap = String(r?.apellidos_docente || "").trim();
    const no = String(r?.nombres_docente || "").trim();
    const id = String(r?.id_institucional_docente || "").trim();
    return `${ap} ${no}`.trim() || id || "(sin nombre)";
  }

  for (let i = 0; i < rows.length; i++) {
    const fila = i + 1;
    const r = rows[i] || {};

    try {
      const id_institucional_docente = String(r.id_institucional_docente || "").trim();
      const cedula = String(r.cedula || "").trim();
      const apellidos_docente = String(r.apellidos_docente || "").trim();
      const nombres_docente = String(r.nombres_docente || "").trim();
      const correo_docente_raw = String(r.correo_docente || "").trim();
      const telefono_docente = String(r.telefono_docente || "").trim();
      const nombre_usuario = String(r.nombre_usuario || "").trim();

      // ✅ mensaje humano (no “campos de base”)
      if (
        !id_institucional_docente ||
        !cedula ||
        !apellidos_docente ||
        !nombres_docente ||
        !correo_docente_raw ||
        !nombre_usuario
      ) {
        resultado.resumen.omitidos++;
        resultado.detalles.omitidos.push({
          fila,
          motivo: `Campos incompletos en ${nombrePersona(r)}`,
          id_institucional_docente,
          cedula,
          nombre_usuario,
        });
        continue;
      }

      // correo obligatorio + .ec/.com
      const correo = ensureCorreoFlexible(correo_docente_raw);

      // ✅ no re-importar duplicados (NO rompes la importación completa)
      if (await repo.findByInstitucional(id_institucional_docente)) {
        resultado.resumen.omitidos++;
        resultado.detalles.omitidos.push({
          fila,
          motivo: `Ya existe (ID institucional) → ${nombrePersona(r)}`,
          id_institucional_docente,
          cedula,
          nombre_usuario,
        });
        continue;
      }

      if (await repo.findByCedula(cedula)) {
        resultado.resumen.omitidos++;
        resultado.detalles.omitidos.push({
          fila,
          motivo: `Ya existe (cédula) → ${nombrePersona(r)}`,
          id_institucional_docente,
          cedula,
          nombre_usuario,
        });
        continue;
      }

      if (await repo.findByUsername(nombre_usuario)) {
        resultado.resumen.omitidos++;
        resultado.detalles.omitidos.push({
          fila,
          motivo: `Ya existe (usuario) → ${nombrePersona(r)}`,
          id_institucional_docente,
          cedula,
          nombre_usuario,
        });
        continue;
      }

      // ✅ password inicial = cédula (PLANO)
      const cedulaPlano = cedula;
      if (cedulaPlano.length < 6) {
        resultado.resumen.omitidos++;
        resultado.detalles.omitidos.push({
          fila,
          motivo: `Cédula inválida para clave inicial → ${nombrePersona(r)}`,
          id_institucional_docente,
          cedula,
          nombre_usuario,
        });
        continue;
      }

      const created = await repo.create({
        id_institucional_docente,
        id_departamento: depId,
        cedula,
        nombres_docente,
        apellidos_docente,
        correo_docente: correo,
        telefono_docente: telefono_docente || null,
        nombre_usuario,
        passwordPlano: cedulaPlano, // ✅ se guarda plano primera vez
      });

      // rol DOCENTE automático
      await repo.assignRolToDocente({
        id_rol: 3,
        id_docente: Number(created.id_docente),
      });

      resultado.resumen.importados++;
      resultado.detalles.importados.push({
        fila,
        id_institucional_docente,
        cedula,
        nombre_usuario,
      });
    } catch (e) {
      resultado.resumen.omitidos++;
      resultado.detalles.omitidos.push({
        fila,
        motivo: `${e?.message ? e.message : "Error desconocido"} → ${nombrePersona(r)}`,
        id_institucional_docente: String(r.id_institucional_docente || "").trim(),
        cedula: String(r.cedula || "").trim(),
        nombre_usuario: String(r.nombre_usuario || "").trim(),
      });
    }
  }

  return resultado;
}

module.exports = {
  list,
  get,
  create,
  update,
  changeEstado,
  setSuperAdmin,
  importBulk, // ✅ exportado
};
