// src/repositories/carrera_admin.repo.js
const pool = require("../config/db");

const ADMIN_ROLE_ID = 2;

/** ✅ valida carrera_periodo existente */
async function carreraPeriodoExists(idCarreraPeriodo) {
  const [r] = await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [Number(idCarreraPeriodo)]
  );
  return !!r.length;
}

/** ✅ valida docente existente y ACTIVO */
async function docenteActivoExists(idDocente) {
  const [r] = await pool.query(
    `SELECT id_docente, estado FROM docente WHERE id_docente=? LIMIT 1`,
    [Number(idDocente)]
  );
  if (!r.length) return { ok: false, reason: "NOT_FOUND" };
  if (Number(r[0].estado) !== 1) return { ok: false, reason: "INACTIVE" };
  return { ok: true };
}

/** ✅ devuelve director/apoyo activos por carrera_periodo (incluye datos del docente) */
async function getAdmins(idCarreraPeriodo) {
  const cpId = Number(idCarreraPeriodo);

  const [rows] = await pool.query(
    `
    SELECT
      cpa.tipo_admin,
      d.id_docente,
      d.nombres_docente,
      d.apellidos_docente,
      d.nombre_usuario,
      d.correo_docente
    FROM carrera_periodo_autoridad cpa
    JOIN docente d ON d.id_docente = cpa.id_docente
    WHERE cpa.id_carrera_periodo = ?
      AND cpa.estado = 1
      AND cpa.tipo_admin IN ('DIRECTOR','APOYO')
    `,
    [cpId]
  );

  const director = rows.find((x) => x.tipo_admin === "DIRECTOR") || null;
  const apoyo = rows.find((x) => x.tipo_admin === "APOYO") || null;

  return { id_carrera_periodo: cpId, director, apoyo };
}

/** ✅ asegura rol ADMIN (2) activo */
async function ensureAdminRole(idDocente, conn) {
  const [r] = await conn.query(
    `SELECT id_rol_docente, estado FROM rol_docente WHERE id_rol=? AND id_docente=? LIMIT 1`,
    [ADMIN_ROLE_ID, Number(idDocente)]
  );

  if (r.length) {
    if (Number(r[0].estado) === 0) {
      await conn.query(
        `UPDATE rol_docente SET estado=1, updated_at=CURRENT_TIMESTAMP WHERE id_rol_docente=?`,
        [r[0].id_rol_docente]
      );
    }
    return;
  }

  await conn.query(
    `INSERT INTO rol_docente (id_rol, id_docente, estado) VALUES (?, ?, 1)`,
    [ADMIN_ROLE_ID, Number(idDocente)]
  );
}

/**
 * ✅ desactiva rol ADMIN(2) SI el docente ya no tiene NINGUNA autoridad activa
 * en carrera_periodo_autoridad.
 */
async function deactivateAdminRoleIfNoActiveAuthority(idDocente, conn) {
  const docenteId = Number(idDocente);
  if (!docenteId) return;

  const [rows] = await conn.query(
    `
    SELECT EXISTS(
      SELECT 1
      FROM carrera_periodo_autoridad
      WHERE id_docente = ?
        AND estado = 1
        AND tipo_admin IN ('DIRECTOR','APOYO')
    ) AS tiene_admin
    `,
    [docenteId]
  );

  const tieneAdmin = Number(rows?.[0]?.tiene_admin || 0) === 1;
  if (!tieneAdmin) {
    await conn.query(
      `UPDATE rol_docente
       SET estado=0, updated_at=CURRENT_TIMESTAMP
       WHERE id_rol=? AND id_docente=?`,
      [ADMIN_ROLE_ID, docenteId]
    );
  }
}

async function deactivateCurrent(idCarreraPeriodo, tipoAdmin, conn) {
  await conn.query(
    `
    UPDATE carrera_periodo_autoridad
    SET estado=0, updated_at=CURRENT_TIMESTAMP
    WHERE id_carrera_periodo=? AND tipo_admin=? AND estado=1
    `,
    [Number(idCarreraPeriodo), tipoAdmin]
  );
}

/**
 * ✅ UPSERT (por si ya existía el mismo docente+tipo en el mismo cp)
 * (tu UNIQUE es (id_carrera_periodo,id_docente,tipo_admin))
 */
async function assign(idCarreraPeriodo, idDocente, tipoAdmin, conn) {
  await conn.query(
    `
    INSERT INTO carrera_periodo_autoridad (id_carrera_periodo, id_docente, tipo_admin, estado)
    VALUES (?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE
      estado = 1,
      updated_at = CURRENT_TIMESTAMP
    `,
    [Number(idCarreraPeriodo), Number(idDocente), tipoAdmin]
  );
}

async function setAdmins(idCarreraPeriodo, { id_docente_director, id_docente_apoyo }) {
  const cpOk = await carreraPeriodoExists(idCarreraPeriodo);
  if (!cpOk) {
    const e = new Error("Carrera-Período no existe");
    e.status = 404;
    throw e;
  }

  // Nota: tu validator deja optional int; aquí permitimos null/undefined/""
  const idDir =
    id_docente_director === null || id_docente_director === undefined || id_docente_director === ""
      ? null
      : Number(id_docente_director);

  const idApo =
    id_docente_apoyo === null || id_docente_apoyo === undefined || id_docente_apoyo === ""
      ? null
      : Number(id_docente_apoyo);

  // ✅ (OPCIONAL) regla: evitar mismo docente en ambos.
  // Tú dijiste que aún no están seguros: lo dejo desactivado por ahora.
  // if (idDir && idApo && Number(idDir) === Number(idApo)) {
  //   const e = new Error("Director y apoyo no pueden ser el mismo docente");
  //   e.status = 422;
  //   throw e;
  // }

  // ✅ validar docentes si vienen
  if (idDir) {
    const chk = await docenteActivoExists(idDir);
    if (!chk.ok) {
      const e = new Error(chk.reason === "INACTIVE" ? "Docente inactivo" : "Docente no encontrado");
      e.status = chk.reason === "INACTIVE" ? 409 : 404;
      throw e;
    }
  }
  if (idApo) {
    const chk = await docenteActivoExists(idApo);
    if (!chk.ok) {
      const e = new Error(chk.reason === "INACTIVE" ? "Docente inactivo" : "Docente no encontrado");
      e.status = chk.reason === "INACTIVE" ? 409 : 404;
      throw e;
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Guardar actuales para luego ajustar roles (si los quitamos)
    const [current] = await conn.query(
      `
      SELECT tipo_admin, id_docente
      FROM carrera_periodo_autoridad
      WHERE id_carrera_periodo = ?
        AND estado = 1
        AND tipo_admin IN ('DIRECTOR','APOYO')
      `,
      [Number(idCarreraPeriodo)]
    );

    const oldDir = (current.find((r) => r.tipo_admin === "DIRECTOR") || {}).id_docente || null;
    const oldApo = (current.find((r) => r.tipo_admin === "APOYO") || {}).id_docente || null;

    // ✅ Director: si viene null => desactiva el actual y listo
    if (idDir !== null) {
      await deactivateCurrent(idCarreraPeriodo, "DIRECTOR", conn);
      if (idDir) {
        await assign(idCarreraPeriodo, idDir, "DIRECTOR", conn);
        await ensureAdminRole(idDir, conn);
      }
    }

    // ✅ Apoyo: si viene null => desactiva el actual y listo
    if (idApo !== null) {
      await deactivateCurrent(idCarreraPeriodo, "APOYO", conn);
      if (idApo) {
        await assign(idCarreraPeriodo, idApo, "APOYO", conn);
        await ensureAdminRole(idApo, conn);
      }
    }

    // ✅ si se removieron autoridades, desactivar rol 2 solo si ya no tiene ninguna activa en ningún periodo
    if (oldDir) await deactivateAdminRoleIfNoActiveAuthority(oldDir, conn);
    if (oldApo) await deactivateAdminRoleIfNoActiveAuthority(oldApo, conn);

    await conn.commit();
    return await getAdmins(idCarreraPeriodo);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getAdmins, setAdmins };
