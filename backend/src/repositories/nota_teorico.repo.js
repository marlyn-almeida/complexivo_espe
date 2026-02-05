const pool = require("../config/db");

async function getByEstudianteCp(id_estudiante, id_carrera_periodo) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM nota_teorico_estudiante
    WHERE id_estudiante = ? AND id_carrera_periodo = ? AND estado = 1
    LIMIT 1
    `,
    [id_estudiante, id_carrera_periodo]
  );
  return rows[0] || null;
}

async function validateEstudianteEnCP(id_estudiante, id_carrera_periodo) {
  const [rows] = await pool.query(
    `SELECT 1 FROM estudiante WHERE id_estudiante = ? AND id_carrera_periodo = ? AND estado = 1 LIMIT 1`,
    [id_estudiante, id_carrera_periodo]
  );
  return rows.length > 0;
}

async function upsert({ id_estudiante, id_carrera_periodo, nota_teorico_20, observacion, id_docente_registra }) {
  const [r] = await pool.query(
    `
    INSERT INTO nota_teorico_estudiante
      (id_estudiante, id_carrera_periodo, nota_teorico_20, observacion, id_docente_registra)
    VALUES (?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      nota_teorico_20 = VALUES(nota_teorico_20),
      observacion = VALUES(observacion),
      id_docente_registra = VALUES(id_docente_registra),
      updated_at = CURRENT_TIMESTAMP,
      estado = 1
    `,
    [id_estudiante, id_carrera_periodo, nota_teorico_20, observacion || null, id_docente_registra]
  );
  return r.affectedRows;
}

module.exports = { getByEstudianteCp, validateEstudianteEnCP, upsert };
