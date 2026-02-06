// src/repositories/entregas_caso.repo.js
const pool = require("../config/db");

async function getEntrega(id_estudiante, id_caso_estudio, { includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM estudiante_caso_entrega
    WHERE id_estudiante = ?
      AND id_caso_estudio = ?
      AND (? = 1 OR estado = 1)
    LIMIT 1
    `,
    [id_estudiante, id_caso_estudio, includeInactive ? 1 : 0]
  );
  return rows[0] || null;
}

async function upsertEntrega({
  id_estudiante,
  id_caso_estudio,
  archivo_nombre,
  archivo_path,
  observacion,
}) {
  await pool.query(
    `
    INSERT INTO estudiante_caso_entrega
      (id_estudiante, id_caso_estudio, archivo_nombre, archivo_path, fecha_entrega, observacion, estado)
    VALUES (?,?,?,?, NOW(), ?, 1)
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

  return getEntrega(id_estudiante, id_caso_estudio, { includeInactive: true });
}

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
  return (
    Number(row.cp_est) === Number(id_carrera_periodo) &&
    Number(row.cp_caso) === Number(id_carrera_periodo)
  );
}

async function setEstado(id_estudiante, id_caso_estudio, estado) {
  await pool.query(
    `
    UPDATE estudiante_caso_entrega
    SET estado = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id_estudiante = ? AND id_caso_estudio = ?
    `,
    [estado ? 1 : 0, id_estudiante, id_caso_estudio]
  );
  return getEntrega(id_estudiante, id_caso_estudio, { includeInactive: true });
}

module.exports = {
  getEntrega,
  upsertEntrega,
  validateEntregaScope,
  setEstado,
};
