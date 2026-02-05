const pool = require("../config/db");

async function getEntrega(id_estudiante, id_caso_estudio) {
  const [rows] = await pool.query(
    `SELECT * FROM estudiante_caso_entrega
     WHERE id_estudiante = ? AND id_caso_estudio = ? AND estado = 1
     LIMIT 1`,
    [id_estudiante, id_caso_estudio]
  );
  return rows[0] || null;
}

async function getEntregaById(id_estudiante_caso_entrega) {
  const [rows] = await pool.query(
    `SELECT * FROM estudiante_caso_entrega WHERE id_estudiante_caso_entrega = ?`,
    [id_estudiante_caso_entrega]
  );
  return rows[0] || null;
}

async function upsertEntrega({ id_estudiante, id_caso_estudio, archivo_nombre, archivo_path, observacion }) {
  const [r] = await pool.query(
    `
    INSERT INTO estudiante_caso_entrega
      (id_estudiante, id_caso_estudio, archivo_nombre, archivo_path, fecha_entrega, observacion)
    VALUES (?,?,?,?, NOW(), ?)
    ON DUPLICATE KEY UPDATE
      archivo_nombre = VALUES(archivo_nombre),
      archivo_path   = VALUES(archivo_path),
      fecha_entrega  = NOW(),
      observacion    = VALUES(observacion),
      updated_at     = CURRENT_TIMESTAMP,
      estado         = 1
    `,
    [id_estudiante, id_caso_estudio, archivo_nombre, archivo_path, observacion || null]
  );
  return r.affectedRows;
}

/**
 * Validación de alcance:
 * - asegura que el estudiante pertenece al cp
 * - asegura que el caso pertenece al cp
 */
async function validateEntregaScope(id_carrera_periodo, id_estudiante, id_caso_estudio) {
  const [rows] = await pool.query(
    `
    SELECT
      (SELECT e.id_carrera_periodo FROM estudiante e WHERE e.id_estudiante = ? LIMIT 1) AS cp_est,
      (SELECT c.id_carrera_periodo FROM caso_estudio c WHERE c.id_caso_estudio = ? LIMIT 1) AS cp_caso
    `,
    [id_estudiante, id_caso_estudio]
  );

  const row = rows[0] || {};
  return Number(row.cp_est) === Number(id_carrera_periodo) && Number(row.cp_caso) === Number(id_carrera_periodo);
}

module.exports = { getEntrega, getEntregaById, upsertEntrega, validateEntregaScope };
