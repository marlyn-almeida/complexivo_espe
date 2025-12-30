const db = require("../config/db");

exports.findAll = async ({ id_rubrica, includeInactive = false }) => {
  const params = [Number(id_rubrica)];
  let sql = `SELECT * FROM rubrica_nivel WHERE id_rubrica=?`;
  if (!includeInactive) sql += ` AND estado=1`;
  sql += ` ORDER BY orden_nivel ASC, id_rubrica_nivel ASC`;
  const [rows] = await db.query(sql, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM rubrica_nivel WHERE id_rubrica_nivel=? LIMIT 1`,
    [Number(id)]
  );
  return rows[0] || null;
};

exports.mustBelongToRubrica = async (id_rubrica_nivel, id_rubrica) => {
  const row = await exports.findById(id_rubrica_nivel);
  if (!row) {
    const e = new Error("Nivel no existe");
    e.status = 404;
    throw e;
  }
  if (Number(row.id_rubrica) !== Number(id_rubrica)) {
    const e = new Error("Nivel no pertenece a esta rúbrica");
    e.status = 409;
    throw e;
  }
  return true;
};

exports.create = async (d) => {
  const [res] = await db.query(
    `INSERT INTO rubrica_nivel (id_rubrica, nombre_nivel, valor_nivel, orden_nivel, estado)
     VALUES (?,?,?,?,1)`,
    [d.id_rubrica, d.nombre_nivel, d.valor_nivel, d.orden_nivel]
  );
  return exports.findById(res.insertId);
};

exports.update = async (id, d) => {
  await db.query(
    `UPDATE rubrica_nivel
     SET nombre_nivel=?, valor_nivel=?, orden_nivel=?, updated_at=CURRENT_TIMESTAMP
     WHERE id_rubrica_nivel=?`,
    [d.nombre_nivel, d.valor_nivel, d.orden_nivel, Number(id)]
  );
  return exports.findById(id);
};

exports.setEstado = async (id, estado) => {
  await db.query(
    `UPDATE rubrica_nivel SET estado=?, updated_at=CURRENT_TIMESTAMP WHERE id_rubrica_nivel=?`,
    [estado ? 1 : 0, Number(id)]
  );
  return exports.findById(id);
};
