// src/repositories/tribunal.repo.js
const pool = require("../config/db");

async function carreraPeriodoExists(id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [id_carrera_periodo]
  );
  return r.length > 0;
}

async function getCarreraIdByCarreraPeriodo(id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT id_carrera FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [id_carrera_periodo]
  );
  return r[0]?.id_carrera ?? null;
}

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

async function createWithDocentes(d) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.query(
      `INSERT INTO tribunal (id_carrera_periodo, id_carrera_docente, nombre_tribunal, descripcion_tribunal, estado)
       VALUES (?, ?, ?, ?, 1)`,
      [
        d.id_carrera_periodo,
        d.id_carrera_docente,
        d.nombre_tribunal,
        d.descripcion_tribunal ?? null,
      ]
    );

    const tribunalId = res.insertId;

    await conn.query(
      `INSERT INTO tribunal_docente (id_tribunal, id_carrera_docente, designacion, estado)
       VALUES ?`,
      [[
        [tribunalId, Number(d.docentes.presidente),  "PRESIDENTE",   1],
        [tribunalId, Number(d.docentes.integrante1), "INTEGRANTE_1", 1],
        [tribunalId, Number(d.docentes.integrante2), "INTEGRANTE_2", 1],
      ]]
    );

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

    await conn.query(
      `UPDATE tribunal
       SET id_carrera_periodo=?, id_carrera_docente=?, nombre_tribunal=?, descripcion_tribunal=?
       WHERE id_tribunal=?`,
      [
        d.id_carrera_periodo,
        d.id_carrera_docente,
        d.nombre_tribunal,
        d.descripcion_tribunal ?? null,
        id_tribunal,
      ]
    );

    if (d.docentes) {
      await conn.query(`DELETE FROM tribunal_docente WHERE id_tribunal=?`, [id_tribunal]);

      await conn.query(
        `INSERT INTO tribunal_docente (id_tribunal, id_carrera_docente, designacion, estado)
         VALUES ?`,
        [[
          [id_tribunal, Number(d.docentes.presidente),  "PRESIDENTE",   1],
          [id_tribunal, Number(d.docentes.integrante1), "INTEGRANTE_1", 1],
          [id_tribunal, Number(d.docentes.integrante2), "INTEGRANTE_2", 1],
        ]]
      );
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

async function findMisTribunales({ id_docente, includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_tribunal,
      t.id_carrera_periodo,
      t.nombre_tribunal,
      t.descripcion_tribunal,
      t.estado,
      td.designacion,
      c.nombre_carrera,
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
    ORDER BY t.created_at DESC
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
  findMisTribunales,
};
