const db = require("../config/db");

exports.findAll = async ({ id_rubrica, includeInactive = false }) => {
  const params = [Number(id_rubrica)];
  let sql = `SELECT * FROM rubrica_componente WHERE id_rubrica=?`;
  if (!includeInactive) sql += ` AND estado=1`;
  sql += ` ORDER BY orden ASC, id_rubrica_componente ASC`;
  const [rows] = await db.query(sql, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM rubrica_componente WHERE id_rubrica_componente=? LIMIT 1`,
    [Number(id)]
  );
  return rows[0] || null;
};

exports.mustBelongToRubrica = async (id_rubrica_componente, id_rubrica) => {
  const row = await exports.findById(id_rubrica_componente);
  if (!row) {
    const e = new Error("Componente no existe");
    e.status = 404;
    throw e;
  }
  if (Number(row.id_rubrica) !== Number(id_rubrica)) {
    const e = new Error("Componente no pertenece a esta rúbrica");
    e.status = 409;
    throw e;
  }
  return true;
};

exports.create = async (d) => {
  const [res] = await db.query(
    `INSERT INTO rubrica_componente (id_rubrica, nombre_componente, tipo_componente, ponderacion, orden, estado)
     VALUES (?,?,?,?,?,1)`,
    [d.id_rubrica, d.nombre_componente, d.tipo_componente, d.ponderacion, d.orden]
  );
  return exports.findById(res.insertId);
};

exports.update = async (id, d) => {
  await db.query(
    `UPDATE rubrica_componente
     SET nombre_componente=?, tipo_componente=?, ponderacion=?, orden=?, updated_at=CURRENT_TIMESTAMP
     WHERE id_rubrica_componente=?`,
    [d.nombre_componente, d.tipo_componente, d.ponderacion, d.orden, Number(id)]
  );
  return exports.findById(id);
};

exports.setEstado = async (id, estado) => {
  await db.query(
    `UPDATE rubrica_componente SET estado=?, updated_at=CURRENT_TIMESTAMP WHERE id_rubrica_componente=?`,
    [estado ? 1 : 0, Number(id)]
  );
  return exports.findById(id);
};
