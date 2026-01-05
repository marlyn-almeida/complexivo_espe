const pool = require("../config/db");

async function findAll({ includeInactive = false, q = "", page = 1, limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const where = [];
  const params = [];

  if (!includeInactive) where.push("estado=1");

  if (q && q.trim()) {
    where.push("(nombre_rol LIKE ? OR IFNULL(descripcion_rol,'') LIKE ?)");
    const like = `%${q.trim()}%`;
    params.push(like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT id_rol, nombre_rol, descripcion_rol, estado
    FROM rol
    ${whereSql}
    ORDER BY id_rol DESC
    LIMIT ? OFFSET ?
  `;

  params.push(safeLimit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    "SELECT id_rol, nombre_rol, descripcion_rol, estado FROM rol WHERE id_rol=?",
    [id]
  );
  return rows[0] || null;
}

async function findByName(nombre_rol) {
  const [rows] = await pool.query(
    "SELECT id_rol, nombre_rol, descripcion_rol, estado FROM rol WHERE nombre_rol=? LIMIT 1",
    [nombre_rol]
  );
  return rows[0] || null;
}

async function create({ nombre_rol, descripcion_rol }) {
  const [result] = await pool.query(
    `INSERT INTO rol (nombre_rol, descripcion_rol, estado)
     VALUES (?, ?, 1)`,
    [nombre_rol, descripcion_rol || null]
  );
  return findById(result.insertId);
}

async function update(id, { nombre_rol, descripcion_rol }) {
  await pool.query(
    `UPDATE rol
     SET nombre_rol=?, descripcion_rol=?
     WHERE id_rol=?`,
    [nombre_rol, descripcion_rol || null, id]
  );
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query("UPDATE rol SET estado=? WHERE id_rol=?", [estado ? 1 : 0, id]);
  return findById(id);
}

module.exports = { findAll, findById, findByName, create, update, setEstado };
