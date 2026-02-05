// src/repositories/estudiante.repo.js
const pool = require("../config/db");

async function carreraPeriodoExists(id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [id_carrera_periodo]
  );
  return r.length > 0;
}

// ✅ valida que un carrera_periodo pertenezca a una carrera (scope rol 2)
async function carreraPeriodoBelongsToCarrera(id_carrera_periodo, id_carrera) {
  const [r] = await pool.query(
    `SELECT 1
     FROM carrera_periodo
     WHERE id_carrera_periodo = ?
       AND id_carrera = ?
     LIMIT 1`,
    [id_carrera_periodo, id_carrera]
  );
  return r.length > 0;
}

async function findAll({
  includeInactive = false,
  q = "",
  page = 1,
  limit = 50,
  carreraPeriodoId = null,
  scopeCarreraId = null,
} = {}) {
  const safeLimit = Math.min(Math.max(+limit || 50, 1), 100);
  const safePage = Math.max(+page || 1, 1);
  const offset = (safePage - 1) * safeLimit;

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
      e.nombre_usuario LIKE ? OR
      e.cedula LIKE ? OR
      e.nombres_estudiante LIKE ? OR
      e.apellidos_estudiante LIKE ? OR
      IFNULL(e.correo_estudiante,'') LIKE ?
    )`);
    const like = `%${q.trim()}%`;
    params.push(like, like, like, like, like, like);
  }

  // ✅ Scope rol 2: solo estudiantes de la carrera del usuario
  if (scopeCarreraId) {
    where.push("c.id_carrera=?");
    params.push(+scopeCarreraId);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT
      e.id_estudiante,
      e.id_carrera_periodo,
      e.id_institucional_estudiante,
      e.nombre_usuario,
      e.cedula,
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
      e.id_estudiante,
      e.id_carrera_periodo,
      e.id_institucional_estudiante,
      e.nombre_usuario,
      e.cedula,
      e.nombres_estudiante,
      e.apellidos_estudiante,
      e.correo_estudiante,
      e.telefono_estudiante,
      e.estado,
      e.created_at,
      e.updated_at
     FROM estudiante e
     WHERE e.id_estudiante=?`,
    [id]
  );
  return r[0] || null;
}

// ✅ duplicado por carrera_periodo (NO global)
async function findByInstitucionalInCarreraPeriodo(id_carrera_periodo, id_institucional_estudiante) {
  const [r] = await pool.query(
    `SELECT id_estudiante, id_carrera_periodo, id_institucional_estudiante
     FROM estudiante
     WHERE id_carrera_periodo=? AND id_institucional_estudiante=?
     LIMIT 1`,
    [id_carrera_periodo, id_institucional_estudiante]
  );
  return r[0] || null;
}

// ✅ duplicado por carrera_periodo (NO global)
async function findByCedulaInCarreraPeriodo(id_carrera_periodo, cedula) {
  const [r] = await pool.query(
    `SELECT id_estudiante, id_carrera_periodo, cedula
     FROM estudiante
     WHERE id_carrera_periodo=? AND cedula=?
     LIMIT 1`,
    [id_carrera_periodo, cedula]
  );
  return r[0] || null;
}

// ✅ duplicado username por carrera_periodo (NO global)
async function findByUsernameInCarreraPeriodo(id_carrera_periodo, nombre_usuario) {
  const [r] = await pool.query(
    `SELECT id_estudiante, id_carrera_periodo, nombre_usuario
     FROM estudiante
     WHERE id_carrera_periodo=? AND nombre_usuario=?
     LIMIT 1`,
    [id_carrera_periodo, nombre_usuario]
  );
  return r[0] || null;
}

async function create(d) {
  const [res] = await pool.query(
    `INSERT INTO estudiante
      (id_carrera_periodo, id_institucional_estudiante, nombre_usuario, cedula, nombres_estudiante, apellidos_estudiante, correo_estudiante, telefono_estudiante, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      d.id_carrera_periodo,
      d.id_institucional_estudiante,
      d.nombre_usuario,
      d.cedula,
      d.nombres_estudiante,
      d.apellidos_estudiante,
      d.correo_estudiante ?? null,
      d.telefono_estudiante ?? null,
    ]
  );
  return findById(res.insertId);
}

async function update(id, d) {
  await pool.query(
    `UPDATE estudiante
     SET id_carrera_periodo=?,
         id_institucional_estudiante=?,
         nombre_usuario=?,
         cedula=?,
         nombres_estudiante=?,
         apellidos_estudiante=?,
         correo_estudiante=?,
         telefono_estudiante=?
     WHERE id_estudiante=?`,
    [
      d.id_carrera_periodo,
      d.id_institucional_estudiante,
      d.nombre_usuario,
      d.cedula,
      d.nombres_estudiante,
      d.apellidos_estudiante,
      d.correo_estudiante ?? null,
      d.telefono_estudiante ?? null,
      id,
    ]
  );
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(`UPDATE estudiante SET estado=? WHERE id_estudiante=?`, [
    estado ? 1 : 0,
    id,
  ]);
  return findById(id);
}

// ===============================
// ✅ ASIGNACIONES (ROL 2)
// ===============================

// Nota teórica por estudiante + carrera_periodo
async function findNotaTeoricoByEstudianteCp(id_estudiante, id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT
      id_nota_teorico,
      id_estudiante,
      id_carrera_periodo,
      nota_teorico_20,
      observacion,
      created_at,
      updated_at
     FROM nota_teorico_estudiante
     WHERE id_estudiante=? AND id_carrera_periodo=?
     LIMIT 1`,
    [id_estudiante, id_carrera_periodo]
  );
  return r[0] || null;
}

// ✅ Caso asignado al estudiante (usa columnas reales: archivo_nombre / archivo_path)
async function findCasoAsignadoByEstudianteCp(id_estudiante, id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT
      ce.id_caso_estudio,
      ce.numero_caso,
      ce.titulo,
      ce.descripcion,
      ce.archivo_nombre,
      ce.archivo_path,
      t.id_tribunal
     FROM tribunal_estudiante te
     JOIN tribunal t ON t.id_tribunal = te.id_tribunal
     JOIN caso_estudio ce ON ce.id_caso_estudio = t.id_caso_estudio
     WHERE te.id_estudiante=?
       AND t.id_carrera_periodo=?
       AND t.id_caso_estudio IS NOT NULL
     LIMIT 1`,
    [id_estudiante, id_carrera_periodo]
  );
  return r[0] || null;
}

// ✅ Entrega del estudiante por caso (usa columnas reales)
async function findEntregaByEstudianteCaso(id_estudiante, id_caso_estudio) {
  const [r] = await pool.query(
    `SELECT
      id_estudiante_caso_entrega,
      id_estudiante,
      id_caso_estudio,
      archivo_nombre,
      archivo_path,
      fecha_entrega,
      observacion,
      estado,
      created_at,
      updated_at
     FROM estudiante_caso_entrega
     WHERE id_estudiante=? AND id_caso_estudio=? AND estado=1
     ORDER BY COALESCE(updated_at, created_at) DESC
     LIMIT 1`,
    [id_estudiante, id_caso_estudio]
  );
  return r[0] || null;
}

module.exports = {
  carreraPeriodoExists,
  carreraPeriodoBelongsToCarrera,
  findAll,
  findById,
  findByInstitucionalInCarreraPeriodo,
  findByCedulaInCarreraPeriodo,
  findByUsernameInCarreraPeriodo,
  create,
  update,
  setEstado,

  // ✅ ASIGNACIONES
  findNotaTeoricoByEstudianteCp,
  findCasoAsignadoByEstudianteCp,
  findEntregaByEstudianteCaso,
};
