const pool = require("../config/db");
const ADMIN_ROLE_ID = 2;

async function carreraPeriodoExists(idCarreraPeriodo) {
  const [r] = await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [Number(idCarreraPeriodo)]
  );
  return !!r.length;
}

async function docenteActivoExists(idDocente) {
  const [r] = await pool.query(
    `SELECT id_docente, estado FROM docente WHERE id_docente=? LIMIT 1`,
    [Number(idDocente)]
  );
  if (!r.length) return { ok: false, reason: "NOT_FOUND" };
  if (Number(r[0].estado) !== 1) return { ok: false, reason: "INACTIVE" };
  return { ok: true };
}

async function getAdmins(idCarreraPeriodo) {
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
    WHERE cd.id_carrera_periodo = ?
      AND cd.estado = 1
      AND cd.tipo_admin IN ('DIRECTOR','APOYO')
    `,
    [Number(idCarreraPeriodo)]
  );

  const director = rows.find((x) => x.tipo_admin === "DIRECTOR") || null;
  const apoyo = rows.find((x) => x.tipo_admin === "APOYO") || null;

  return { id_carrera_periodo: Number(idCarreraPeriodo), director, apoyo };
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

async function deactivateCurrent(idCarreraPeriodo, tipoAdmin, conn) {
  await conn.query(
    `
    UPDATE carrera_docente
    SET estado=0, updated_at=CURRENT_TIMESTAMP
    WHERE id_carrera_periodo=? AND tipo_admin=? AND estado=1
    `,
    [Number(idCarreraPeriodo), tipoAdmin]
  );
}

async function assign(idCarreraPeriodo, idDocente, tipoAdmin, conn) {
  const [ex] = await conn.query(
    `
    SELECT id_carrera_docente
    FROM carrera_docente
    WHERE id_carrera_periodo=? AND id_docente=? AND tipo_admin=?
    LIMIT 1
    `,
    [Number(idCarreraPeriodo), Number(idDocente), tipoAdmin]
  );

  if (ex.length) {
    await conn.query(
      `UPDATE carrera_docente SET estado=1, updated_at=CURRENT_TIMESTAMP WHERE id_carrera_docente=?`,
      [ex[0].id_carrera_docente]
    );
    return;
  }

  await conn.query(
    `
    INSERT INTO carrera_docente (id_docente, id_carrera_periodo, tipo_admin, estado)
    VALUES (?, ?, ?, 1)
    `,
    [Number(idDocente), Number(idCarreraPeriodo), tipoAdmin]
  );
}

async function setAdmins(idCarreraPeriodo, { id_docente_director, id_docente_apoyo }) {
  const cpOk = await carreraPeriodoExists(idCarreraPeriodo);
  if (!cpOk) {
    const e = new Error("carrera_periodo no existe");
    e.status = 404;
    throw e;
  }

  const idDir = id_docente_director ? Number(id_docente_director) : null;
  const idApo = id_docente_apoyo ? Number(id_docente_apoyo) : null;

  if (!idDir && !idApo) {
    const e = new Error("Debe enviar id_docente_director y/o id_docente_apoyo");
    e.status = 422;
    throw e;
  }

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

    if (idDir) {
      await deactivateCurrent(idCarreraPeriodo, "DIRECTOR", conn);
      await assign(idCarreraPeriodo, idDir, "DIRECTOR", conn);
      await ensureAdminRole(idDir, conn);
    }

    if (idApo) {
      await deactivateCurrent(idCarreraPeriodo, "APOYO", conn);
      await assign(idCarreraPeriodo, idApo, "APOYO", conn);
      await ensureAdminRole(idApo, conn);
    }

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
