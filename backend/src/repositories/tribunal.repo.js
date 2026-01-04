// src/repositories/tribunal.repo.js
const pool = require("../config/db");

async function carreraPeriodoExists(id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [id_carrera_periodo]
  );
  return r.length > 0;
}

// ✅ obtiene id_carrera del carrera_periodo (para validar coherencia)
async function getCarreraIdByCarreraPeriodo(id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT id_carrera FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [id_carrera_periodo]
  );
  return r[0]?.id_carrera ?? null;
}

// ✅ carrera_docente pertenece a una carrera (NO a carrera_periodo)
async function getCarreraIdByCarreraDocente(id_carrera_docente) {
  const [r] = await pool.query(
    `SELECT id_carrera_docente, id_carrera, tipo_admin, estado
     FROM carrera_docente
     WHERE id_carrera_docente=? LIMIT 1`,
    [id_carrera_docente]
  );
  return r[0] || null;
}

async function findAll({ includeInactive = false, carreraPeriodoId = null, scopeCarreraId = null } = {}) {
  const where = [];
  const params = [];

  if (!includeInactive) where.push("t.estado=1");
  if (carreraPeriodoId) {
    where.push("t.id_carrera_periodo=?");
    params.push(+carreraPeriodoId);
  }

  // ✅ scope por carrera (Rol 2): amarrado por join a carrera
  if (scopeCarreraId) {
    where.push("c.id_carrera=?");
    params.push(+scopeCarreraId);
  }

  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `
    SELECT
      t.id_tribunal,
      t.id_carrera_periodo,
      t.id_carrera_docente,
      t.caso,
      t.nombre_tribunal,
      t.descripcion_tribunal,
      t.estado,
      t.created_at,
      t.updated_at,
      c.nombre_carrera,
      c.codigo_carrera,
      pa.codigo_periodo
    FROM tribunal t
    JOIN carrera_periodo cp ON cp.id_carrera_periodo=t.id_carrera_periodo
    JOIN carrera c ON c.id_carrera=cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo=cp.id_periodo
    ${ws}
    ORDER BY t.created_at DESC
  `,
    params
  );

  return rows;
}

async function findById(id) {
  const [r] = await pool.query(`SELECT * FROM tribunal WHERE id_tribunal=?`, [id]);
  return r[0] || null;
}

async function findDocentesByTribunal(id_tribunal) {
  const [rows] = await pool.query(
    `
    SELECT
      td.id_tribunal_docente,
      td.id_tribunal,
      td.id_carrera_docente,
      td.designacion,
      td.estado,
      d.id_docente,
      d.nombres_docente,
      d.apellidos_docente
    FROM tribunal_docente td
    JOIN carrera_docente cd ON cd.id_carrera_docente = td.id_carrera_docente
    JOIN docente d ON d.id_docente = cd.id_docente
    WHERE td.id_tribunal=?
    ORDER BY FIELD(td.designacion,'PRESIDENTE','INTEGRANTE_1','INTEGRANTE_2')
  `,
    [id_tribunal]
  );
  return rows;
}

// =====================================================
// ✅ TRANSACCIONES
// =====================================================

// calcula caso = MAX+1 bajo lock por carrera_periodo
async function getNextCasoTx(conn, id_carrera_periodo) {
  const [r] = await conn.query(
    `SELECT COALESCE(MAX(caso),0)+1 AS nextCaso
     FROM tribunal
     WHERE id_carrera_periodo=?
     FOR UPDATE`,
    [id_carrera_periodo]
  );
  return r[0]?.nextCaso ?? 1;
}

async function insertTribunalTx(conn, d) {
  const [res] = await conn.query(
    `INSERT INTO tribunal
      (id_carrera_periodo, id_carrera_docente, caso, nombre_tribunal, descripcion_tribunal, estado)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [
      d.id_carrera_periodo,
      d.id_carrera_docente, // lo fijamos como PRESIDENTE (o responsable)
      d.caso,
      d.nombre_tribunal,
      d.descripcion_tribunal ?? null,
    ]
  );
  return res.insertId;
}

async function upsertDocentesTx(conn, id_tribunal, docentes) {
  // docentes: { presidente, integrante1, integrante2 } con ids de carrera_docente
  // estrategia simple y segura: borrar y volver a insertar
  await conn.query(`DELETE FROM tribunal_docente WHERE id_tribunal=?`, [id_tribunal]);

  // ✅ FIX: cada fila debe tener 4 valores porque insertas 4 columnas
  const values = [
    [id_tribunal, Number(docentes.presidente),  "PRESIDENTE",   1],
    [id_tribunal, Number(docentes.integrante1), "INTEGRANTE_1", 1],
    [id_tribunal, Number(docentes.integrante2), "INTEGRANTE_2", 1],
  ];

  await conn.query(
    `INSERT INTO tribunal_docente (id_tribunal, id_carrera_docente, designacion, estado)
     VALUES ?`,
    [values]
  );
}

async function createWithDocentes(d) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ caso opcional: si no viene, lo generamos
    const casoFinal = d.caso ? +d.caso : await getNextCasoTx(conn, d.id_carrera_periodo);

    const tribunalId = await insertTribunalTx(conn, {
      ...d,
      caso: casoFinal,
    });

    await upsertDocentesTx(conn, tribunalId, d.docentes);

    await conn.commit();
    return tribunalId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function updateWithDocentes(id_tribunal, d) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ si caso no viene, mantenemos el actual
    let casoFinal = d.caso;
    if (!casoFinal) {
      const [r] = await conn.query(`SELECT caso FROM tribunal WHERE id_tribunal=? LIMIT 1`, [id_tribunal]);
      casoFinal = r[0]?.caso;
    }

    await conn.query(
      `UPDATE tribunal
       SET id_carrera_periodo=?, id_carrera_docente=?, caso=?, nombre_tribunal=?, descripcion_tribunal=?
       WHERE id_tribunal=?`,
      [
        d.id_carrera_periodo,
        d.id_carrera_docente,
        casoFinal,
        d.nombre_tribunal,
        d.descripcion_tribunal ?? null,
        id_tribunal,
      ]
    );

    if (d.docentes) {
      await upsertDocentesTx(conn, id_tribunal, d.docentes);
    }

    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function setEstado(id, estado) {
  await pool.query(`UPDATE tribunal SET estado=? WHERE id_tribunal=?`, [estado ? 1 : 0, id]);
  return findById(id);
}

// ✅ NUEVO: Mis tribunales (ROL 3)
// Devuelve tribunales donde el docente está asignado en tribunal_docente.
async function findMisTribunales({ id_docente, includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_tribunal,
      t.id_carrera_periodo,
      t.id_carrera_docente,
      t.caso,
      t.nombre_tribunal,
      t.descripcion_tribunal,
      t.estado,
      t.created_at,
      t.updated_at,

      td.designacion,

      c.nombre_carrera,
      c.codigo_carrera,
      pa.codigo_periodo
    FROM tribunal_docente td
    JOIN carrera_docente cd ON cd.id_carrera_docente = td.id_carrera_docente
    JOIN tribunal t ON t.id_tribunal = td.id_tribunal
    JOIN carrera_periodo cp ON cp.id_carrera_periodo = t.id_carrera_periodo
    JOIN carrera c ON c.id_carrera = cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo = cp.id_periodo
    WHERE cd.id_docente = ?
      AND cd.estado = 1
      AND td.estado = 1
      AND (? = 1 OR t.estado = 1)
    ORDER BY t.caso DESC, t.created_at DESC
    `,
    [Number(id_docente), includeInactive ? 1 : 0]
  );

  return rows;
}

module.exports = {
  carreraPeriodoExists,
  getCarreraIdByCarreraPeriodo,
  getCarreraIdByCarreraDocente,
  findAll,
  findById,
  findDocentesByTribunal,
  createWithDocentes,
  updateWithDocentes,
  setEstado,
  findMisTribunales, // ✅ NUEVO
};
