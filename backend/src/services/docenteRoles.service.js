// src/services/docenteRoles.service.js
const docenteRepo = require("../repositories/docente.repo");
const rolesRepo = require("../repositories/docenteRoles.repo");

// En tu BD el rol ADMIN es id_rol=2
const ADMIN_ROLE_ID = 2;

async function getRolesByDocenteId(id_docente) {
  const docente = await docenteRepo.findById(Number(id_docente));
  if (!docente) {
    const err = new Error("Docente no encontrado");
    err.status = 404;
    throw err;
  }

  const allRoles = await rolesRepo.getAllRoles({ includeInactive: true });
  const activeRoleIds = await rolesRepo.getActiveRoleIdsByDocente(Number(id_docente));

  return {
    docente: {
      id_docente: Number(docente.id_docente),
      nombres_docente: docente.nombres_docente,
      apellidos_docente: docente.apellidos_docente,
      nombre_usuario: docente.nombre_usuario,
      estado: docente.estado,
    },
    roles: allRoles.map((r) => ({
      id_rol: Number(r.id_rol),
      nombre_rol: r.nombre_rol,
      descripcion_rol: r.descripcion_rol,
      estado: Number(r.estado), // estado del rol en catálogo
      assigned: activeRoleIds.includes(Number(r.id_rol)),
    })),
    activeRoleIds,
  };
}

async function setRolesByDocenteId(id_docente, roleIds = []) {
  const docente = await docenteRepo.findById(Number(id_docente));
  if (!docente) {
    const err = new Error("Docente no encontrado");
    err.status = 404;
    throw err;
  }

  // Normaliza IDs
  const normalized = Array.from(new Set((roleIds || []).map(Number))).filter(
    (n) => Number.isFinite(n) && n > 0
  );

  // Regla: no permitir quitar ADMIN si sigue como DIRECTOR/APOYO activo
  const wantsAdmin = normalized.includes(ADMIN_ROLE_ID);
  if (!wantsAdmin) {
    const isDirectorOrApoyo = await rolesRepo.hasActiveDirectorOrApoyo(Number(id_docente));
    if (isDirectorOrApoyo) {
      const err = new Error(
        "No se puede quitar rol ADMIN porque el docente es DIRECTOR/APOYO activo en una carrera"
      );
      err.status = 409;
      throw err;
    }
  }

  // Aplicar estado 1/0 para todos los roles del catálogo
  const allRoles = await rolesRepo.getAllRoles({ includeInactive: true });
  const allRoleIds = allRoles.map((r) => Number(r.id_rol));

  for (const id_rol of allRoleIds) {
    const shouldBeActive = normalized.includes(id_rol);
    await rolesRepo.upsertRolDocenteEstado({
      id_docente: Number(id_docente),
      id_rol,
      estado: shouldBeActive,
    });
  }

  return {
    ok: true,
    id_docente: Number(id_docente),
    roleIds: normalized,
  };
}

module.exports = { getRolesByDocenteId, setRolesByDocenteId };
