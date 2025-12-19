const pool = require("../config/db");

async function findAll({ includeInactive = false, q = "", page = 1, limit = 50, departamentoId = null } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const where = [];
  const params = [];

  if (!includeInactive) where.push("estado=1");

  if (departamentoId) {
    where.push("id_departamento=?");
    params.push(Number(departamentoId));
  }

  if (q && q.trim()) {
    where.push(`(
      nombre_carrera LIKE ? OR
      codigo_carrera LIKE ? OR
      IFNULL(descripcion_carrera,'') LIKE ? OR
      IFNULL(sede,'') LIKE ? OR
      IFNULL(modalidad,'') LIKE ?
    )`);
    const like = `%${q.trim()}%`;
    params.push(like, like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT
      id_carrera,
      nombre_carrera,
      codigo_carrera,
      descripcion_carrera,
      id_departamento,
      sede,
      modalidad,
      estado,
      created_at,
      updated_at
    FROM carrera
    ${whereSql}
    ORDER BY id_carrera DESC
    LIMIT ? OFFSET ?
  `;

  params.push(safeLimit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT
      id_carrera, nombre_carrera, codigo_carrera, descripcion_carrera,
      id_departamento, sede, modalidad, estado, created_at, updated_at
     FROM carrera
     WHERE id_carrera=?`,
    [id]
  );
  return rows[0] || null;
}

async function findByNombre(nombre_carrera) {
  const [rows] = await pool.query(
    `SELECT id_carrera, nombre_carrera FROM carrera WHERE nombre_carrera=? LIMIT 1`,
    [nombre_carrera]
  );
  return rows[0] || null;
}

async function findByCodigo(codigo_carrera) {
  const [rows] = await pool.query(
    `SELECT id_carrera, codigo_carrera FROM carrera WHERE codigo_carrera=? LIMIT 1`,
    [codigo_carrera]
  );
  return rows[0] || null;
}

async function departamentoExists(id_departamento) {
  const [rows] = await pool.query(
    `SELECT id_departamento FROM departamento WHERE id_departamento=? LIMIT 1`,
    [id_departamento]
  );
  return !!rows.length;
}

async function create(data) {
  const {
    nombre_carrera,
    codigo_carrera,
    descripcion_carrera = null,
    id_departamento,
    sede = null,
    modalidad = null
  } = data;

  const [result] = await pool.query(
    `INSERT INTO carrera
      (nombre_carrera, codigo_carrera, descripcion_carrera, id_departamento, sede, modalidad, estado)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [nombre_carrera, codigo_carrera, descripcion_carrera, id_departamento, sede, modalidad]
  );

  return findById(result.insertId);
}

async function update(id, data) {
  const {
    nombre_carrera,
    codigo_carrera,
    descripcion_carrera = null,
    id_departamento,
    sede = null,
    modalidad = null
  } = data;

  await pool.query(
    `UPDATE carrera
     SET nombre_carrera=?, codigo_carrera=?, descripcion_carrera=?, id_departamento=?, sede=?, modalidad=?
     WHERE id_carrera=?`,
    [nombre_carrera, codigo_carrera, descripcion_carrera, id_departamento, sede, modalidad, id]
  );

  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(
    `UPDATE carrera SET estado=? WHERE id_carrera=?`,
    [estado ? 1 : 0, id]
  );
  return findById(id);
}

module.exports = {
  findAll, findById,
  findByNombre, findByCodigo,
  departamentoExists,
  create, update, setEstado
};
