const pool = require("../config/db");

async function carreraPeriodoExists(id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [id_carrera_periodo]
  );
  return !!r.length;
}

async function carreraDocenteExists(id_carrera_docente) {
  const [r] = await pool.query(
    `SELECT id_carrera_docente, id_carrera_periodo
     FROM carrera_docente
     WHERE id_carrera_docente=? LIMIT 1`,
    [id_carrera_docente]
  );
  return r[0] || null; // devuelve también id_carrera_periodo para validar coherencia
}

async function findAll({ includeInactive=false, carreraPeriodoId=null }={}) {
  const where=[], params=[];
  if (!includeInactive) where.push("t.estado=1");
  if (carreraPeriodoId) { where.push("t.id_carrera_periodo=?"); params.push(+carreraPeriodoId); }
  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(`
    SELECT
      t.*,
      c.nombre_carrera,
      c.codigo_carrera,
      pa.codigo_periodo
    FROM tribunal t
    JOIN carrera_periodo cp ON cp.id_carrera_periodo=t.id_carrera_periodo
    JOIN carrera c ON c.id_carrera=cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo=cp.id_periodo
    ${ws}
    ORDER BY t.created_at DESC
  `, params);

  return rows;
}

async function findById(id) {
  const [r] = await pool.query(`SELECT * FROM tribunal WHERE id_tribunal=?`, [id]);
  return r[0] || null;
}

async function create(d) {
  const [res] = await pool.query(
    `INSERT INTO tribunal
      (id_carrera_periodo, id_carrera_docente, nombre_tribunal, estado)
     VALUES (?, ?, ?, 1)`,
    [d.id_carrera_periodo, d.id_carrera_docente, d.nombre_tribunal]
  );
  return findById(res.insertId);
}

async function update(id, d) {
  await pool.query(
    `UPDATE tribunal
     SET id_carrera_periodo=?, id_carrera_docente=?, nombre_tribunal=?
     WHERE id_tribunal=?`,
    [d.id_carrera_periodo, d.id_carrera_docente, d.nombre_tribunal, id]
  );
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(`UPDATE tribunal SET estado=? WHERE id_tribunal=?`, [estado?1:0, id]);
  return findById(id);
}

module.exports = {
  carreraPeriodoExists,
  carreraDocenteExists,
  findAll,
  findById,
  create,
  update,
  setEstado
};
