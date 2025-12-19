const pool = require("../config/db");

async function findAll({ includeInactive = false, q = "", page = 1, limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const where = [];
  const params = [];

  if (!includeInactive) where.push("estado=1");

  if (q && q.trim()) {
    where.push(`(
      cedula LIKE ? OR
      id_institucional_docente LIKE ? OR
      nombres_docente LIKE ? OR
      apellidos_docente LIKE ? OR
      IFNULL(correo_docente,'') LIKE ? OR
      nombre_usuario LIKE ?
    )`);
    const like = `%${q.trim()}%`;
    params.push(like, like, like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT
      id_docente,
      id_institucional_docente,
      cedula,
      nombres_docente,
      apellidos_docente,
      correo_docente,
      telefono_docente,
      nombre_usuario,
      debe_cambiar_password,
      estado,
      created_at,
      updated_at
    FROM docente
    ${whereSql}
    ORDER BY id_docente DESC
    LIMIT ? OFFSET ?
  `;
  params.push(safeLimit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT
      id_docente,
      id_institucional_docente,
      cedula,
      nombres_docente,
      apellidos_docente,
      correo_docente,
      telefono_docente,
      nombre_usuario,
      debe_cambiar_password,
      estado,
      created_at,
      updated_at
     FROM docente
     WHERE id_docente=?`,
    [id]
  );
  return rows[0] || null;
}

async function findByCedula(cedula) {
  const [rows] = await pool.query(
    `SELECT id_docente, cedula FROM docente WHERE cedula=? LIMIT 1`,
    [cedula]
  );
  return rows[0] || null;
}

async function findByUsername(nombre_usuario) {
  const [rows] = await pool.query(
    `SELECT id_docente, nombre_usuario FROM docente WHERE nombre_usuario=? LIMIT 1`,
    [nombre_usuario]
  );
  return rows[0] || null;
}

async function findByInstitucional(id_institucional_docente) {
  const [rows] = await pool.query(
    `SELECT id_docente, id_institucional_docente FROM docente WHERE id_institucional_docente=? LIMIT 1`,
    [id_institucional_docente]
  );
  return rows[0] || null;
}

async function findAuthByUsername(nombre_usuario) {
  const [rows] = await pool.query(
    `SELECT id_docente, nombre_usuario, password, debe_cambiar_password, estado
     FROM docente
     WHERE nombre_usuario=? LIMIT 1`,
    [nombre_usuario]
  );
  return rows[0] || null;
}

async function create(data) {
  const {
    id_institucional_docente,
    cedula,
    nombres_docente,
    apellidos_docente,
    correo_docente = null,
    telefono_docente = null,
    nombre_usuario,
    passwordHash
  } = data;

  const [result] = await pool.query(
    `INSERT INTO docente
      (id_institucional_docente, cedula, nombres_docente, apellidos_docente, correo_docente, telefono_docente, nombre_usuario, password, debe_cambiar_password, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
    [
      id_institucional_docente,
      cedula,
      nombres_docente,
      apellidos_docente,
      correo_docente,
      telefono_docente,
      nombre_usuario,
      passwordHash
    ]
  );

  return findById(result.insertId);
}

async function update(id, data) {
  const {
    id_institucional_docente,
    cedula,
    nombres_docente,
    apellidos_docente,
    correo_docente = null,
    telefono_docente = null,
    nombre_usuario
  } = data;

  await pool.query(
    `UPDATE docente
     SET id_institucional_docente=?, cedula=?, nombres_docente=?, apellidos_docente=?, correo_docente=?, telefono_docente=?, nombre_usuario=?
     WHERE id_docente=?`,
    [
      id_institucional_docente,
      cedula,
      nombres_docente,
      apellidos_docente,
      correo_docente,
      telefono_docente,
      nombre_usuario,
      id
    ]
  );

  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(
    `UPDATE docente SET estado=? WHERE id_docente=?`,
    [estado ? 1 : 0, id]
  );
  return findById(id);
}

async function updatePasswordAndClearFlag(id, passwordHash) {
  await pool.query(
    `UPDATE docente SET password=?, debe_cambiar_password=0 WHERE id_docente=?`,
    [passwordHash, id]
  );
  return findById(id);
}

module.exports = {
  findAll, findById,
  findByCedula, findByUsername, findByInstitucional,
  findAuthByUsername,
  create, update, setEstado,
  updatePasswordAndClearFlag
};
