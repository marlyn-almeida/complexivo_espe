const pool = require("../config/db");

async function findAll({ includeInactive = false, q = "" } = {}) {
  const where = [];
  const params = [];

  if (!includeInactive) where.push("estado=1");

  if (q && q.trim()) {
    where.push(`(
      nombre_departamento LIKE ? OR
      IFNULL(descripcion_departamento,'') LIKE ?
    )`);
    const like = `%${q.trim()}%`;
    params.push(like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT
      id_departamento,
      nombre_departamento,
      descripcion_departamento,
      estado,
      created_at,
      updated_at
    FROM departamento
    ${whereSql}
    ORDER BY id_departamento DESC
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT
      id_departamento,
      nombre_departamento,
      descripcion_departamento,
      estado,
      created_at,
      updated_at
     FROM departamento
     WHERE id_departamento=?`,
    [id]
  );
  return rows[0] || null;
}

async function findByNombre(nombre_departamento) {
  const [rows] = await pool.query(
    `SELECT id_departamento, nombre_departamento
     FROM departamento
     WHERE nombre_departamento=? LIMIT 1`,
    [nombre_departamento]
  );
  return rows[0] || null;
}

async function create(data) {
  const { nombre_departamento, descripcion_departamento = null } = data;

  const [result] = await pool.query(
    `INSERT INTO departamento
      (nombre_departamento, descripcion_departamento, estado)
     VALUES (?, ?, 1)`,
    [nombre_departamento, descripcion_departamento]
  );

  return findById(result.insertId);
}

async function update(id, data) {
  const { nombre_departamento, descripcion_departamento = null } = data;

  await pool.query(
    `UPDATE departamento
     SET nombre_departamento=?, descripcion_departamento=?
     WHERE id_departamento=?`,
    [nombre_departamento, descripcion_departamento, id]
  );

  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(
    `UPDATE departamento SET estado=? WHERE id_departamento=?`,
    [estado ? 1 : 0, id]
  );
  return findById(id);
}

module.exports = {
  findAll,
  findById,
  findByNombre,
  create,
  update,
  setEstado,
};
