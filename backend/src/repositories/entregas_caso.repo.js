// ✅ src/repositories/entregas_caso.repo.js
const pool = require("../config/db");

/**
 * ✅ Obtener entrega por estudiante
 */
async function getEntregaByEstudiante(id_estudiante, { includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM estudiante_entrega
    WHERE id_estudiante = ?
      AND (? = 1 OR estado = 1)
    LIMIT 1
    `,
    [Number(id_estudiante), includeInactive ? 1 : 0]
  );
  return rows[0] || null;
}

/**
 * ✅ Insert/Update por estudiante (UNIQUE(id_estudiante))
 */
async function upsertEntregaByEstudiante({ id_estudiante, archivo_nombre, archivo_path, observacion }) {
  await pool.query(
    `
    INSERT INTO estudiante_entrega
      (id_estudiante, archivo_nombre, archivo_path, fecha_entrega, observacion, estado)
    VALUES (?,?,?,?,?,1)
    ON DUPLICATE KEY UPDATE
      archivo_nombre = VALUES(archivo_nombre),
      archivo_path   = VALUES(archivo_path),
      fecha_entrega  = NOW(),
      observacion    = VALUES(observacion),
      updated_at     = CURRENT_TIMESTAMP,
      estado         = 1
    `,
    [Number(id_estudiante), archivo_nombre, archivo_path, new Date(), observacion || null]
  );

  return getEntregaByEstudiante(id_estudiante, { includeInactive: true });
}

/**
 * ✅ NUEVA VALIDACIÓN (SOLO CP, SIN TRIBUNAL)
 */
async function validateEstudianteEnCP(id_carrera_periodo, id_estudiante) {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM estudiante e
    WHERE e.id_estudiante = ?
      AND e.id_carrera_periodo = ?
      AND e.estado = 1
    LIMIT 1
    `,
    [Number(id_estudiante), Number(id_carrera_periodo)]
  );
  return !!rows.length;
}

/**
 * ✅ Validación por tribunal (SE MANTIENE para DOCENTE)
 */
async function validateEstudianteEnTribunalCP(id_carrera_periodo, id_estudiante) {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM tribunal_estudiante te
    JOIN tribunal t ON t.id_tribunal = te.id_tribunal
    WHERE te.id_estudiante = ?
      AND te.estado = 1
      AND t.id_carrera_periodo = ?
    LIMIT 1
    `,
    [Number(id_estudiante), Number(id_carrera_periodo)]
  );
  return !!rows.length;
}

/**
 * ✅ Permiso DOCENTE
 */
async function docentePuedeVerEntregaByEstudiante({ id_docente, id_carrera_periodo, id_estudiante }) {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM tribunal_docente td
    JOIN carrera_docente cd ON cd.id_carrera_docente = td.id_carrera_docente
    JOIN tribunal t ON t.id_tribunal = td.id_tribunal
    JOIN tribunal_estudiante te ON te.id_tribunal = td.id_tribunal
    WHERE cd.id_docente = ?
      AND cd.estado = 1
      AND td.estado = 1
      AND te.estado = 1
      AND te.id_estudiante = ?
      AND t.id_carrera_periodo = ?
    LIMIT 1
    `,
    [Number(id_docente), Number(id_estudiante), Number(id_carrera_periodo)]
  );

  return !!rows.length;
}

module.exports = {
  getEntregaByEstudiante,
  upsertEntregaByEstudiante,
  validateEstudianteEnCP,
  validateEstudianteEnTribunalCP,
  docentePuedeVerEntregaByEstudiante,
};
