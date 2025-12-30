const db = require("../config/db");

exports.findAll = async ({ id_rubrica_componente, includeInactive = false }) => {
  const params = [Number(id_rubrica_componente)];
  let sql = `SELECT * FROM rubrica_criterio WHERE id_rubrica_componente=?`;
  if (!includeInactive) sql += ` AND estado=1`;
  sql += ` ORDER BY orden ASC, id_rubrica_criterio ASC`;
  const [rows] = await db.query(sql, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM rubrica_criterio WHERE id_rubrica_criterio=? LIMIT 1`,
    [Number(id)]
  );
  return rows[0] || null;
};

exports.mustBelongToComponente = async (id_rubrica_criterio, id_rubrica_componente) => {
  const row = await exports.findById(id_rubrica_criterio);
  if (!row) {
    const e = new Error("Criterio no existe");
    e.status = 404;
    throw e;
  }
  if (Number(row.id_rubrica_componente) !== Number(id_rubrica_componente)) {
    const e = new Error("Criterio no pertenece a este componente");
    e.status = 409;
    throw e;
  }
  return true;
};

exports.create = async (d) => {
  const [res] = await db.query(
    `INSERT INTO rubrica_criterio (id_rubrica_componente, nombre_criterio, orden, estado)
     VALUES (?,?,?,1)`,
    [d.id_rubrica_componente, d.nombre_criterio, d.orden]
  );
  return exports.findById(res.insertId);
};

exports.update = async (id, d) => {
  await db.query(
    `UPDATE rubrica_criterio
     SET nombre_criterio=?, orden=?, updated_at=CURRENT_TIMESTAMP
     WHERE id_rubrica_criterio=?`,
    [d.nombre_criterio, d.orden, Number(id)]
  );
  return exports.findById(id);
};

exports.setEstado = async (id, estado) => {
  await db.query(
    `UPDATE rubrica_criterio SET estado=?, updated_at=CURRENT_TIMESTAMP WHERE id_rubrica_criterio=?`,
    [estado ? 1 : 0, Number(id)]
  );
  return exports.findById(id);
};
