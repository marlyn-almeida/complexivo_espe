const pool = require("../config/db");

async function carreraPeriodoExists(id_carrera_periodo) {
  const [r] = await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`,
    [id_carrera_periodo]
  );
  return !!r.length;
}

async function findAll({ includeInactive = false, carreraPeriodoId = null } = {}) {
  const where = [], params = [];
  if (!includeInactive) where.push("r.estado=1");
  if (carreraPeriodoId) { where.push("r.id_carrera_periodo=?"); params.push(+carreraPeriodoId); }
  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM rubrica r ${ws} ORDER BY r.created_at DESC`,
    params
  );
  return rows;
}

async function findById(id) {
  const [r] = await pool.query(`SELECT * FROM rubrica WHERE id_rubrica=?`, [id]);
  return r[0] || null;
}

async function create(d) {
  const [res] = await pool.query(
    `INSERT INTO rubrica
      (id_carrera_periodo, tipo_rubrica, ponderacion_global, nombre_rubrica, descripcion_rubrica, estado)
     VALUES (?,?,?,?,?,1)`,
    [
      d.id_carrera_periodo,
      d.tipo_rubrica,
      d.ponderacion_global ?? 50.0,
      d.nombre_rubrica,
      d.descripcion_rubrica ?? null,
    ]
  );
  return findById(res.insertId);
}

async function update(id, d) {
  await pool.query(
    `UPDATE rubrica
     SET id_carrera_periodo=?,
         tipo_rubrica=?,
         ponderacion_global=?,
         nombre_rubrica=?,
         descripcion_rubrica=?
     WHERE id_rubrica=?`,
    [
      d.id_carrera_periodo,
      d.tipo_rubrica,
      d.ponderacion_global ?? 50.0,
      d.nombre_rubrica,
      d.descripcion_rubrica ?? null,
      id,
    ]
  );
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(`UPDATE rubrica SET estado=? WHERE id_rubrica=?`, [estado ? 1 : 0, id]);
  return findById(id);
}

module.exports = { carreraPeriodoExists, findAll, findById, create, update, setEstado };
