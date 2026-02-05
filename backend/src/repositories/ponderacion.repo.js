const pool = require("../config/db");

async function getByCP(id_carrera_periodo) {
  const [rows] = await pool.query(
    `SELECT * FROM config_ponderacion_examen WHERE id_carrera_periodo = ? AND estado = 1 LIMIT 1`,
    [id_carrera_periodo]
  );
  return rows[0] || null;
}

async function upsert({
  id_carrera_periodo,
  peso_teorico_final_pct,
  peso_practico_final_pct,
  peso_practico_escrito_pct,
  peso_practico_oral_pct,
}) {
  const [r] = await pool.query(
    `
    INSERT INTO config_ponderacion_examen
      (id_carrera_periodo, peso_teorico_final_pct, peso_practico_final_pct, peso_practico_escrito_pct, peso_practico_oral_pct)
    VALUES (?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      peso_teorico_final_pct = VALUES(peso_teorico_final_pct),
      peso_practico_final_pct = VALUES(peso_practico_final_pct),
      peso_practico_escrito_pct = VALUES(peso_practico_escrito_pct),
      peso_practico_oral_pct = VALUES(peso_practico_oral_pct),
      updated_at = CURRENT_TIMESTAMP,
      estado = 1
    `,
    [id_carrera_periodo, peso_teorico_final_pct, peso_practico_final_pct, peso_practico_escrito_pct, peso_practico_oral_pct]
  );
  return r.affectedRows;
}

module.exports = { getByCP, upsert };
