const db = require("../config/db");

exports.findAll = async ({ id_rubrica_criterio, includeInactive = false }) => {
  const params = [Number(id_rubrica_criterio)];
  let sql = `
    SELECT rcn.*, rn.nombre_nivel, rn.valor_nivel, rn.orden_nivel
    FROM rubrica_criterio_nivel rcn
    JOIN rubrica_nivel rn ON rn.id_rubrica_nivel = rcn.id_rubrica_nivel
    WHERE rcn.id_rubrica_criterio = ?
  `;
  if (!includeInactive) sql += ` AND rcn.estado=1`;
  sql += ` ORDER BY rn.orden_nivel ASC`;
  const [rows] = await db.query(sql, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM rubrica_criterio_nivel WHERE id_rubrica_criterio_nivel=? LIMIT 1`,
    [Number(id)]
  );
  return rows[0] || null;
};

exports.mustBelongToCriterio = async (id_rcn, id_criterio) => {
  const row = await exports.findById(id_rcn);
  if (!row) {
    const e = new Error("Celda no existe");
    e.status = 404;
    throw e;
  }
  if (Number(row.id_rubrica_criterio) !== Number(id_criterio)) {
    const e = new Error("Celda no pertenece a este criterio");
    e.status = 409;
    throw e;
  }
  return true;
};

// Valida que el nivel pertenezca a la misma rubrica del criterio (join real)
exports.nivelPerteneceALaRubricaDelCriterio = async (id_criterio, id_nivel) => {
  const [rows] = await db.query(
    `
    SELECT 1
    FROM rubrica_criterio rc
    JOIN rubrica_componente rco ON rco.id_rubrica_componente = rc.id_rubrica_componente
    JOIN rubrica_nivel rn ON rn.id_rubrica = rco.id_rubrica
    WHERE rc.id_rubrica_criterio = ?
      AND rn.id_rubrica_nivel = ?
    LIMIT 1
    `,
    [Number(id_criterio), Number(id_nivel)]
  );
  return rows.length > 0;
};

exports.upsert = async ({ id_rubrica_criterio, id_rubrica_nivel, descripcion }) => {
  // uq_rcn (id_rubrica_criterio, id_rubrica_nivel)
  await db.query(
    `
    INSERT INTO rubrica_criterio_nivel (id_rubrica_criterio, id_rubrica_nivel, descripcion, estado)
    VALUES (?,?,?,1)
    ON DUPLICATE KEY UPDATE
      descripcion=VALUES(descripcion),
      estado=1,
      updated_at=CURRENT_TIMESTAMP
    `,
    [id_rubrica_criterio, id_rubrica_nivel, descripcion]
  );

  const [rows] = await db.query(
    `SELECT * FROM rubrica_criterio_nivel WHERE id_rubrica_criterio=? AND id_rubrica_nivel=? LIMIT 1`,
    [Number(id_rubrica_criterio), Number(id_rubrica_nivel)]
  );
  return rows[0];
};

exports.setEstado = async (id, estado) => {
  await db.query(
    `UPDATE rubrica_criterio_nivel SET estado=?, updated_at=CURRENT_TIMESTAMP WHERE id_rubrica_criterio_nivel=?`,
    [estado ? 1 : 0, Number(id)]
  );
  return exports.findById(id);
};
