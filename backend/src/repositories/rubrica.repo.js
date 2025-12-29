const db = require("../config/db"); // ajusta si tu pool se llama distinto

exports.findAll = async ({ includeInactive = false, periodoId = null, tipo_rubrica = null }) => {
  const params = [];
  let sql = `
    SELECT r.*
    FROM rubrica r
    WHERE 1=1
  `;

  if (!includeInactive) sql += ` AND r.estado = 1 `;
  if (periodoId) {
    sql += ` AND r.id_periodo = ? `;
    params.push(Number(periodoId));
  }
  if (tipo_rubrica) {
    sql += ` AND r.tipo_rubrica = ? `;
    params.push(tipo_rubrica);
  }

  sql += ` ORDER BY r.id_periodo DESC, FIELD(r.tipo_rubrica,'ORAL','ESCRITA') ASC`;

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

exports.findByPeriodoTipo = async (periodoId, tipo) => {
  const [rows] = await db.query(
    `SELECT * FROM rubrica WHERE id_periodo = ? AND tipo_rubrica = ? LIMIT 1`,
    [Number(periodoId), tipo]
  );
  return rows[0] || null;
};

exports.create = async (d) => {
  const [r] = await db.query(
    `INSERT INTO rubrica
      (id_periodo, tipo_rubrica, ponderacion_global, nombre_rubrica, descripcion_rubrica, estado)
     VALUES (?,?,?,?,?,1)`,
    [
      d.id_periodo,
      d.tipo_rubrica,
      d.ponderacion_global,
      d.nombre_rubrica,
      d.descripcion_rubrica,
    ]
  );
  return exports.findById(r.insertId);
};

exports.update = async (id, d) => {
  await db.query(
    `UPDATE rubrica
     SET id_periodo=?,
         tipo_rubrica=?,
         ponderacion_global=?,
         nombre_rubrica=?,
         descripcion_rubrica=?,
         updated_at=CURRENT_TIMESTAMP
     WHERE id_rubrica=?`,
    [
      d.id_periodo,
      d.tipo_rubrica,
      d.ponderacion_global,
      d.nombre_rubrica,
      d.descripcion_rubrica,
      Number(id),
    ]
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
