const pool = require("../config/db");

async function findAll({ includeInactive=false, q=null } = {}) {
  const where = [];
  const params = [];

  if (!includeInactive) where.push("p.estado=1");
  if (q) {
    where.push("(p.codigo_periodo LIKE ? OR p.descripcion_periodo LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM periodo_academico p ${ws} ORDER BY p.fecha_inicio DESC, p.created_at DESC`,
    params
  );
  return rows;
}

async function findById(id) {
  const [r] = await pool.query(`SELECT * FROM periodo_academico WHERE id_periodo=?`, [id]);
  return r[0] || null;
}

async function existsCodigo(codigo_periodo) {
  const [r] = await pool.query(
    `SELECT id_periodo FROM periodo_academico WHERE codigo_periodo=? LIMIT 1`,
    [codigo_periodo]
  );
  return r[0] || null;
}

async function create(d) {
  const [res] = await pool.query(
    `INSERT INTO periodo_academico
      (codigo_periodo, descripcion_periodo, fecha_inicio, fecha_fin, estado)
     VALUES (?,?,?,?,1)`,
    [d.codigo_periodo, d.descripcion_periodo ?? null, d.fecha_inicio, d.fecha_fin]
  );
  return findById(res.insertId);
}

async function update(id, d) {
  await pool.query(
    `UPDATE periodo_academico
     SET codigo_periodo=?, descripcion_periodo=?, fecha_inicio=?, fecha_fin=?
     WHERE id_periodo=?`,
    [d.codigo_periodo, d.descripcion_periodo ?? null, d.fecha_inicio, d.fecha_fin, id]
  );
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(`UPDATE periodo_academico SET estado=? WHERE id_periodo=?`, [estado ? 1 : 0, id]);
  return findById(id);
}

module.exports = { findAll, findById, existsCodigo, create, update, setEstado };
