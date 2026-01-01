// src/repositories/carrera_admin.repo.js
const pool = require("../config/db");
const ADMIN_ROLE_ID = 2;

// ✅ ahora es por CARRERA (no carrera_periodo)
async function carreraExists(idCarrera) {
  const [r] = await pool.query(
    `SELECT id_carrera FROM carrera WHERE id_carrera=? LIMIT 1`,
    [Number(idCarrera)]
  );
  return !!r.length;
}

// ✅ valida docente existente y ACTIVO
async function docenteActivoExists(idDocente) {
  const [r] = await pool.query(
    `SELECT id_docente, estado FROM docente WHERE id_docente=? LIMIT 1`,
    [Number(idDocente)]
  );
  if (!r.length) return { ok: false, reason: "NOT_FOUND" };
  if (Number(r[0].estado) !== 1) return { ok: false, reason: "INACTIVE" };
  return { ok: true };
}

// ✅ devuelve director/apoyo activos por carrera (incluye datos del docente)
async function getAdmins(idCarrera) {
  const [rows] = await pool.query(
    `
    SELECT
      cd.tipo_admin,
      d.id_docente,
      d.nombres_docente,
      d.apellidos_docente,
      d.nombre_usuario
    FROM carrera_docente cd
    JOIN docente d ON d.id_docente = cd.id_docente
    WHERE cd.id_carrera = ?
      AND cd.estado = 1
      AND cd.tipo_admin IN ('DIRECTOR','APOYO')
    `,
    [Number(idCarrera)]
  );

  const director = rows.find((x) => x.tipo_admin === "DIRECTOR") || null;
  const apoyo = rows.find((x) => x.tipo_admin === "APOYO") || null;

  return { id_carrera: Number(idCarrera), director, apoyo };
}

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

async function deactivateCurrent(idCarrera, tipoAdmin, conn) {
  await conn.query(
    `
    UPDATE carrera_docente
    SET estado=0, updated_at=CURRENT_TIMESTAMP
    WHERE id_carrera=? AND tipo_admin=? AND estado=1
    `,
    [Number(idCarrera), tipoAdmin]
  );
}

/**
 * ✅ FIX: UPSERT para evitar "Duplicate entry ... uq_carrera_docente"
 * Si ya existe la relación (según el UNIQUE), se reactiva y actualiza timestamp.
 */
async function assign(idCarrera, idDocente, tipoAdmin, conn) {
  await conn.query(
    `
    INSERT INTO carrera_docente (id_docente, id_carrera, tipo_admin, estado)
    VALUES (?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE
      estado = 1,
      updated_at = CURRENT_TIMESTAMP
    `,
    [Number(idDocente), Number(idCarrera), tipoAdmin]
  );
}

async function setAdmins(idCarrera, { id_docente_director, id_docente_apoyo }) {
  const cOk = await carreraExists(idCarrera);
  if (!cOk) {
    const e = new Error("Carrera no existe");
    e.status = 404;
    throw e;
  }

  const idDir =
    id_docente_director === null || id_docente_director === undefined || id_docente_director === ""
      ? null
      : Number(id_docente_director);

  const idApo =
    id_docente_apoyo === null || id_docente_apoyo === undefined || id_docente_apoyo === ""
      ? null
      : Number(id_docente_apoyo);

  // ✅ regla: no pueden ser el mismo
  if (idDir && idApo && Number(idDir) === Number(idApo)) {
    const e = new Error("Director y apoyo no pueden ser el mismo docente");
    e.status = 422;
    throw e;
  }

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

    // ✅ Director: si viene null => desactiva el actual y listo
    if (idDir !== null) {
      await deactivateCurrent(idCarrera, "DIRECTOR", conn);
      if (idDir) {
        await assign(idCarrera, idDir, "DIRECTOR", conn);
        await ensureAdminRole(idDir, conn);
      }
    }

    // ✅ Apoyo: si viene null => desactiva el actual y listo
    if (idApo !== null) {
      await deactivateCurrent(idCarrera, "APOYO", conn);
      if (idApo) {
        await assign(idCarrera, idApo, "APOYO", conn);
        await ensureAdminRole(idApo, conn);
      }
    }

    await conn.commit();
    return await getAdmins(idCarrera);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getAdmins, setAdmins };
