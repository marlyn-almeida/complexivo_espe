const pool = require("../config/db");

async function carreraPeriodoExists(id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [id_carrera_periodo]
  );
  return !!r.length;
}

async function findAll({ includeInactive=false, q="", page=1, limit=50, carreraPeriodoId=null } = {}) {
  const safeLimit = Math.min(Math.max(+limit||50,1),100);
  const safePage = Math.max(+page||1,1);
  const offset = (safePage-1)*safeLimit;

  const where = [];
  const params = [];

  if (!includeInactive) where.push("e.estado=1");

  if (carreraPeriodoId) {
    where.push("e.id_carrera_periodo=?");
    params.push(+carreraPeriodoId);
  }

  if (q && q.trim()) {
    where.push(`(
      e.id_institucional_estudiante LIKE ? OR
      e.nombres_estudiante LIKE ? OR
      e.apellidos_estudiante LIKE ? OR
      IFNULL(e.correo_estudiante,'') LIKE ?
    )`);
    const like = `%${q.trim()}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Incluye info útil: carrera + periodo (para reportes/admin)
  const sql = `
    SELECT
      e.id_estudiante,
      e.id_carrera_periodo,
      e.id_institucional_estudiante,
      e.nombres_estudiante,
      e.apellidos_estudiante,
      e.correo_estudiante,
      e.telefono_estudiante,
      e.estado,
      e.created_at,
      e.updated_at,
      c.id_carrera,
      c.nombre_carrera,
      c.codigo_carrera,
      pa.id_periodo,
      pa.codigo_periodo
    FROM estudiante e
    JOIN carrera_periodo cp ON cp.id_carrera_periodo = e.id_carrera_periodo
    JOIN carrera c ON c.id_carrera = cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo = cp.id_periodo
    ${whereSql}
    ORDER BY e.id_estudiante DESC
    LIMIT ? OFFSET ?
  `;
  params.push(safeLimit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function findById(id) {
  const [r] = await pool.query(
    `SELECT
      id_estudiante, id_carrera_periodo, id_institucional_estudiante,
      nombres_estudiante, apellidos_estudiante, correo_estudiante, telefono_estudiante,
      estado, created_at, updated_at
     FROM estudiante
     WHERE id_estudiante=?`,
    [id]
  );
  return r[0] || null;
}

async function findByInstitucional(id_institucional_estudiante) {
  const [r] = await pool.query(
    `SELECT id_estudiante, id_institucional_estudiante
     FROM estudiante
     WHERE id_institucional_estudiante=? LIMIT 1`,
    [id_institucional_estudiante]
  );
  return r[0] || null;
}

async function create(d) {
  const [res] = await pool.query(
    `INSERT INTO estudiante
      (id_carrera_periodo, id_institucional_estudiante, nombres_estudiante, apellidos_estudiante, correo_estudiante, telefono_estudiante, estado)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [
      d.id_carrera_periodo,
      d.id_institucional_estudiante,
      d.nombres_estudiante,
      d.apellidos_estudiante,
      d.correo_estudiante ?? null,
      d.telefono_estudiante ?? null
    ]
  );
  return findById(res.insertId);
}

async function update(id, d) {
  await pool.query(
    `UPDATE estudiante
     SET id_carrera_periodo=?, id_institucional_estudiante=?, nombres_estudiante=?, apellidos_estudiante=?, correo_estudiante=?, telefono_estudiante=?
     WHERE id_estudiante=?`,
    [
      d.id_carrera_periodo,
      d.id_institucional_estudiante,
      d.nombres_estudiante,
      d.apellidos_estudiante,
      d.correo_estudiante ?? null,
      d.telefono_estudiante ?? null,
      id
    ]
  );
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(
    `UPDATE estudiante SET estado=? WHERE id_estudiante=?`,
    [estado ? 1 : 0, id]
  );
  return findById(id);
}

module.exports = {
  carreraPeriodoExists,
  findAll, findById, findByInstitucional,
  create, update, setEstado
};
