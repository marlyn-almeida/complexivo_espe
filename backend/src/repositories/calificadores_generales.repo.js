const pool = require("../config/db");

async function listByCP(id_carrera_periodo, { includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `
    SELECT cg.*,
           cd.id_docente,
           d.nombres_docente, d.apellidos_docente, d.correo_docente
    FROM carrera_periodo_calificador_general cg
    JOIN carrera_docente cd ON cd.id_carrera_docente = cg.id_carrera_docente
    JOIN docente d ON d.id_docente = cd.id_docente
    WHERE cg.id_carrera_periodo = ?
      AND (? = TRUE OR cg.estado = 1)
    ORDER BY d.apellidos_docente ASC, d.nombres_docente ASC
    `,
    [id_carrera_periodo, includeInactive]
  );
  return rows;
}

async function add(id_carrera_periodo, id_carrera_docente) {
  const [r] = await pool.query(
    `
    INSERT INTO carrera_periodo_calificador_general (id_carrera_periodo, id_carrera_docente)
    VALUES (?,?)
    `,
    [id_carrera_periodo, id_carrera_docente]
  );
  return r.insertId;
}

async function deactivate(id_cp_calificador_general) {
  const [r] = await pool.query(
    `
    UPDATE carrera_periodo_calificador_general
    SET estado = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id_cp_calificador_general = ?
    `,
    [id_cp_calificador_general]
  );
  return r.affectedRows;
}

module.exports = { listByCP, add, deactivate };
