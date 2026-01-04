// src/repositories/docente.repo.js
const pool = require("../config/db");

// =============== LISTADO (con scope rol 2) ===============
async function findAll({ includeInactive = false, q = "", page = 1, limit = 50, scopeCarreraId = null } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const where = [];
  const params = [];

  if (!includeInactive) where.push("d.estado=1");

  if (q && q.trim()) {
    where.push(`(
      d.cedula LIKE ? OR
      d.id_institucional_docente LIKE ? OR
      d.nombres_docente LIKE ? OR
      d.apellidos_docente LIKE ? OR
      IFNULL(d.correo_docente,'') LIKE ? OR
      d.nombre_usuario LIKE ?
    )`);
    const like = `%${q.trim()}%`;
    params.push(like, like, like, like, like, like);
  }

  // ✅ Scope rol 2: solo docentes asignados a esa carrera
  // ✅ Evitar duplicados: subquery con MIN(id_carrera_docente)
  let joinSql = "";
  if (scopeCarreraId) {
    joinSql = `
      JOIN (
        SELECT id_docente, MIN(id_carrera_docente) AS id_carrera_docente
        FROM carrera_docente
        WHERE estado = 1
          AND id_carrera = ?
        GROUP BY id_docente
      ) cd ON cd.id_docente = d.id_docente
    `;
    params.unshift(Number(scopeCarreraId));
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT
      ${scopeCarreraId ? "cd.id_carrera_docente" : "NULL"} AS id_carrera_docente,
      d.id_docente,
      d.id_institucional_docente,
      d.cedula,
      d.nombres_docente,
      d.apellidos_docente,
      d.correo_docente,
      d.telefono_docente,
      d.nombre_usuario,
      d.debe_cambiar_password,
      d.estado,
      d.created_at,
      d.updated_at
    FROM docente d
    ${joinSql}
    ${whereSql}
    ORDER BY d.id_docente DESC
    LIMIT ? OFFSET ?
  `;

  params.push(safeLimit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
}

// =============== GETS / FINDS ===============
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

async function findProfileById(id) {
  return findById(id);
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

// Para login (password + flags)
async function findAuthByUsername(nombre_usuario) {
  const [rows] = await pool.query(
    `SELECT id_docente, nombre_usuario, password, debe_cambiar_password, estado
     FROM docente
     WHERE nombre_usuario=? LIMIT 1`,
    [nombre_usuario]
  );
  return rows[0] || null;
}

// =============== ROLES (rol_docente) ===============
async function getRolesByDocenteId(id_docente) {
  const [rows] = await pool.query(
    `SELECT r.id_rol, r.nombre_rol
     FROM rol_docente rd
     JOIN rol r ON r.id_rol = rd.id_rol
     WHERE rd.id_docente = ?
       AND rd.estado = 1
     ORDER BY r.id_rol ASC`,
    [id_docente]
  );
  return rows;
}

// ✅ asigna un rol al docente (ej: rol 3)
// Usa UNIQUE (id_rol, id_docente) => upsert seguro
async function assignRolToDocente({ id_rol, id_docente }) {
  await pool.query(
    `INSERT INTO rol_docente (id_rol, id_docente, estado)
     VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE estado=1`,
    [Number(id_rol), Number(id_docente)]
  );
  return true;
}

// =============== CARRERA_DOCENTE (scope y asignaciones) ===============
async function isDocenteInCarrera(id_docente, id_carrera) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM carrera_docente
     WHERE id_docente = ?
       AND id_carrera = ?
       AND estado = 1
     LIMIT 1`,
    [Number(id_docente), Number(id_carrera)]
  );
  return rows.length > 0;
}

// ✅ NUEVO: scope carrera para rol 2 (DIRECTOR/APOYO)
// Devuelve el id_carrera donde el docente es DIRECTOR o APOYO (estado=1)
async function getScopeCarreraForRol2(id_docente) {
  const [rows] = await pool.query(
    `SELECT id_carrera
     FROM carrera_docente
     WHERE id_docente = ?
       AND estado = 1
       AND tipo_admin IN ('DIRECTOR','APOYO')
     ORDER BY id_carrera_docente ASC
     LIMIT 1`,
    [Number(id_docente)]
  );
  return rows[0]?.id_carrera ?? null;
}

// ✅ asignar docente a carrera como DOCENTE (upsert seguro)
// UNIQUE (id_carrera, id_docente, tipo_admin)
async function assignDocenteToCarrera({ id_carrera, id_docente, tipo_admin = "DOCENTE" }) {
  await pool.query(
    `INSERT INTO carrera_docente (id_docente, id_carrera, tipo_admin, estado)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE estado=1`,
    [Number(id_docente), Number(id_carrera), tipo_admin]
  );
  return true;
}

// =============== CRUD DOCENTE ===============
async function create(data) {
  const {
    id_institucional_docente,
    cedula,
    nombres_docente,
    apellidos_docente,
    correo_docente = null,
    telefono_docente = null,
    nombre_usuario,
    passwordHash,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO docente
      (id_institucional_docente, cedula, nombres_docente, apellidos_docente,
       correo_docente, telefono_docente, nombre_usuario, password,
       debe_cambiar_password, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
    [
      id_institucional_docente,
      cedula,
      nombres_docente,
      apellidos_docente,
      correo_docente,
      telefono_docente,
      nombre_usuario,
      passwordHash,
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
    nombre_usuario,
  } = data;

  await pool.query(
    `UPDATE docente
     SET id_institucional_docente=?,
         cedula=?,
         nombres_docente=?,
         apellidos_docente=?,
         correo_docente=?,
         telefono_docente=?,
         nombre_usuario=?
     WHERE id_docente=?`,
    [
      id_institucional_docente,
      cedula,
      nombres_docente,
      apellidos_docente,
      correo_docente,
      telefono_docente,
      nombre_usuario,
      Number(id),
    ]
  );

  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(`UPDATE docente SET estado=? WHERE id_docente=?`, [estado ? 1 : 0, Number(id)]);
  return findById(id);
}

// =============== PASSWORDS ===============
async function updatePasswordAndClearFlag(id, passwordHash) {
  await pool.query(`UPDATE docente SET password=?, debe_cambiar_password=0 WHERE id_docente=?`, [
    passwordHash,
    Number(id),
  ]);
  return findById(id);
}

async function updatePassword(id, passwordHash) {
  await pool.query(`UPDATE docente SET password=? WHERE id_docente=?`, [passwordHash, Number(id)]);
  return findById(id);
}

module.exports = {
  // list
  findAll,

  // gets/finds
  findById,
  findProfileById,
  findByCedula,
  findByUsername,
  findByInstitucional,
  findAuthByUsername,

  // roles
  getRolesByDocenteId,
  assignRolToDocente,

  // carrera_docente
  isDocenteInCarrera,
  getScopeCarreraForRol2, // ✅ NUEVO
  assignDocenteToCarrera,

  // crud
  create,
  update,
  setEstado,

  // passwords
  updatePasswordAndClearFlag,
  updatePassword,
};
