const pool = require("../config/db");

async function carreraPeriodoExists(id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [id_carrera_periodo]
  );
  return r.length > 0;
}

// ✅ valida que ese carrera_periodo pertenezca a la carrera del scope (Rol2)
async function carreraPeriodoBelongsToCarrera(id_carrera_periodo, id_carrera) {
  const [r] = await pool.query(
    `SELECT 1
     FROM carrera_periodo
     WHERE id_carrera_periodo=? AND id_carrera=? LIMIT 1`,
    [id_carrera_periodo, id_carrera]
  );
  return r.length > 0;
}

// ✅ overlap estándar
async function overlapExists(d, excludeId = null) {
  const params = [
    d.id_carrera_periodo,
    d.fecha,
    d.hora_fin,     // nueva_hora_fin
    d.hora_inicio   // nueva_hora_inicio
  ];

  let sql = `
    SELECT id_franja_horario
    FROM franja_horario
    WHERE id_carrera_periodo=?
      AND fecha=?
      AND estado=1
      AND (hora_inicio < ? AND hora_fin > ?)
  `;

  if (excludeId) {
    sql += ` AND id_franja_horario <> ?`;
    params.push(excludeId);
  }

  const [r] = await pool.query(sql, params);
  return r.length > 0;
}

// ✅ findAll con filtro por carrera (scope)
async function findAll({ includeInactive=false, carreraPeriodoId=null, fecha=null, scopeCarreraId=null } = {}) {
  const where = [];
  const params = [];

  if (!includeInactive) where.push("f.estado=1");
  if (carreraPeriodoId) { where.push("f.id_carrera_periodo=?"); params.push(+carreraPeriodoId); }
  if (fecha) { where.push("f.fecha=?"); params.push(fecha); }

  // 👇 si viene scope, amarra a la carrera por join
  if (scopeCarreraId) { where.push("c.id_carrera=?"); params.push(+scopeCarreraId); }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(`
    SELECT
      f.id_franja_horario,
      f.id_carrera_periodo,
      f.fecha,
      f.hora_inicio,
      f.hora_fin,
      f.laboratorio,
      f.estado,
      c.nombre_carrera,
      pa.codigo_periodo
    FROM franja_horario f
    JOIN carrera_periodo cp ON cp.id_carrera_periodo=f.id_carrera_periodo
    JOIN carrera c ON c.id_carrera=cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo=cp.id_periodo
    ${whereSql}
    ORDER BY f.fecha, f.hora_inicio
  `, params);

  return rows;
}

async function findById(id) {
  const [r] = await pool.query(
    `SELECT * FROM franja_horario WHERE id_franja_horario=?`,
    [id]
  );
  return r[0] || null;
}

async function create(d) {
  const [res] = await pool.query(
    `INSERT INTO franja_horario
      (id_carrera_periodo, fecha, hora_inicio, hora_fin, laboratorio, estado)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [d.id_carrera_periodo, d.fecha, d.hora_inicio, d.hora_fin, d.laboratorio]
  );
  return findById(res.insertId);
}

async function update(id, d) {
  await pool.query(
    `UPDATE franja_horario
     SET id_carrera_periodo=?, fecha=?, hora_inicio=?, hora_fin=?, laboratorio=?
     WHERE id_franja_horario=?`,
    [d.id_carrera_periodo, d.fecha, d.hora_inicio, d.hora_fin, d.laboratorio, id]
  );
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(
    `UPDATE franja_horario SET estado=? WHERE id_franja_horario=?`,
    [estado ? 1 : 0, id]
  );
  return findById(id);
}

module.exports = {
  carreraPeriodoExists,
  carreraPeriodoBelongsToCarrera,
  overlapExists,
  findAll,
  findById,
  create,
  update,
  setEstado
};
