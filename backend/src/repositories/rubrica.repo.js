const db = require("../config/db");

exports.findAll = async ({ includeInactive = false, periodoId = null }) => {
  const params = [];
  let sql = `SELECT r.* FROM rubrica r WHERE 1=1`;

  if (!includeInactive) sql += ` AND r.estado = 1`;
  if (periodoId) {
    sql += ` AND r.id_periodo = ?`;
    params.push(Number(periodoId));
  }

  sql += ` ORDER BY r.id_periodo DESC`;

  const [rows] = await db.query(sql, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM rubrica WHERE id_rubrica = ? LIMIT 1`,
    [Number(id)]
  );
  return rows[0] || null;
};

exports.findByPeriodo = async (id_periodo) => {
  const [rows] = await db.query(
    `SELECT * FROM rubrica WHERE id_periodo = ? LIMIT 1`,
    [Number(id_periodo)]
  );
  return rows[0] || null;
};

exports.create = async (d) => {
  const [res] = await db.query(
    `INSERT INTO rubrica (id_periodo, ponderacion_global, nombre_rubrica, descripcion_rubrica, estado)
     VALUES (?,?,?,?,1)`,
    [
      d.id_periodo,
      d.ponderacion_global,
      d.nombre_rubrica,
      d.descripcion_rubrica,
    ]
  );
  return exports.findById(res.insertId);
};

exports.update = async (id, d) => {
  await db.query(
    `UPDATE rubrica
     SET ponderacion_global=?,
         nombre_rubrica=?,
         descripcion_rubrica=?,
         updated_at=CURRENT_TIMESTAMP
     WHERE id_rubrica=?`,
    [d.ponderacion_global, d.nombre_rubrica, d.descripcion_rubrica, Number(id)]
  );
  return exports.findById(id);
};

exports.setEstado = async (id, estado) => {
  await db.query(
    `UPDATE rubrica SET estado=?, updated_at=CURRENT_TIMESTAMP WHERE id_rubrica=?`,
    [estado ? 1 : 0, Number(id)]
  );
};

exports.periodoExists = async (id_periodo) => {
  const [rows] = await db.query(
    `SELECT 1 FROM periodo_academico WHERE id_periodo=? LIMIT 1`,
    [Number(id_periodo)]
  );
  return rows.length > 0;
};
