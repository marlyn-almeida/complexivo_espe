const pool = require("../config/db");

async function findAll({
  includeInactive = false,
  q = "",
  page = 1,
  limit = 10,
  departamentoId = null,
} = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const where = [];
  const params = [];

  if (!includeInactive) where.push("c.estado = 1");

  if (departamentoId) {
    where.push("c.id_departamento = ?");
    params.push(Number(departamentoId));
  }

  if (q && q.trim()) {
    where.push(`(
      c.nombre_carrera LIKE ? OR
      c.codigo_carrera LIKE ? OR
      IFNULL(c.descripcion_carrera,'') LIKE ? OR
      IFNULL(c.sede,'') LIKE ? OR
      IFNULL(c.modalidad,'') LIKE ?
    )`);
    const like = `%${q.trim()}%`;
    params.push(like, like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT
      c.id_carrera,
      c.nombre_carrera,
      c.codigo_carrera,
      c.descripcion_carrera,
      c.sede,
      c.modalidad,
      c.estado,
      c.created_at,
      c.updated_at,
      d.id_departamento,
      d.nombre_departamento
    FROM carrera c
    INNER JOIN departamento d ON d.id_departamento = c.id_departamento
    ${whereSql}
    ORDER BY c.nombre_carrera ASC
    LIMIT ? OFFSET ?
  `;

  params.push(safeLimit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `
    SELECT
      c.*,
      d.nombre_departamento
    FROM carrera c
    INNER JOIN departamento d ON d.id_departamento = c.id_departamento
    WHERE c.id_carrera = ?
    `,
    [id]
  );
  return rows[0] || null;
}

async function findByNombre(nombre_carrera) {
  const [rows] = await pool.query(
    `SELECT id_carrera FROM carrera WHERE nombre_carrera = ? LIMIT 1`,
    [nombre_carrera]
  );
  return rows[0] || null;
}

async function findByCodigo(codigo_carrera) {
  const [rows] = await pool.query(
    `SELECT id_carrera FROM carrera WHERE codigo_carrera = ? LIMIT 1`,
    [codigo_carrera]
  );
  return rows[0] || null;
}

async function departamentoExists(id_departamento) {
  const [rows] = await pool.query(
    `SELECT id_departamento FROM departamento WHERE id_departamento=? LIMIT 1`,
    [id_departamento]
  );
  return rows.length > 0;
}

async function create(data) {
  const {
    nombre_carrera,
    codigo_carrera,
    descripcion_carrera = null,
    id_departamento,
    sede = null,
    modalidad = null,
  } = data;

  const [result] = await pool.query(
    `
    INSERT INTO carrera
      (nombre_carrera, codigo_carrera, descripcion_carrera, id_departamento, sede, modalidad, estado)
    VALUES (?, ?, ?, ?, ?, ?, 1)
    `,
    [
      nombre_carrera,
      codigo_carrera,
      descripcion_carrera,
      id_departamento,
      sede,
      modalidad,
    ]
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
    modalidad = null,
  } = data;

  await pool.query(
    `
    UPDATE carrera
    SET nombre_carrera=?, codigo_carrera=?, descripcion_carrera=?, id_departamento=?, sede=?, modalidad=?
    WHERE id_carrera=?
    `,
    [
      nombre_carrera,
      codigo_carrera,
      descripcion_carrera,
      id_departamento,
      sede,
      modalidad,
      id,
    ]
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
  findAll,
  findById,
  findByNombre,
  findByCodigo,
  departamentoExists,
  create,
  update,
  setEstado,
};
