// src/repositories/casos_estudio.repo.js
const pool = require("../config/db");

async function listByCP(id_carrera_periodo, { includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM caso_estudio
    WHERE id_carrera_periodo = ?
      AND (? = TRUE OR estado = 1)
    ORDER BY numero_caso ASC
    `,
    [id_carrera_periodo, includeInactive]
  );
  return rows;
}

async function getById(id_caso_estudio) {
  const [rows] = await pool.query(
    `SELECT * FROM caso_estudio WHERE id_caso_estudio = ?`,
    [id_caso_estudio]
  );
  return rows[0] || null;
}

async function create(data) {
  const { id_carrera_periodo, numero_caso, titulo, descripcion, archivo_nombre, archivo_path } = data;

  const [r] = await pool.query(
    `
    INSERT INTO caso_estudio
    (id_carrera_periodo, numero_caso, titulo, descripcion, archivo_nombre, archivo_path)
    VALUES (?,?,?,?,?,?)
    `,
    [id_carrera_periodo, numero_caso, titulo, descripcion, archivo_nombre, archivo_path]
  );

  return r.insertId;
}

async function update(id_caso_estudio, data) {
  const allowed = ["numero_caso", "titulo", "descripcion", "archivo_nombre", "archivo_path", "estado"];

  const fields = [];
  const values = [];

  for (const k of allowed) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`); // ✅ fix
      values.push(k === "estado" ? (data[k] ? 1 : 0) : data[k]);
    }
  }

  if (!fields.length) return 0;

  values.push(id_caso_estudio);

  const [r] = await pool.query(
    `
    UPDATE caso_estudio
    SET ${fields.join(", ")},
        updated_at = CURRENT_TIMESTAMP
    WHERE id_caso_estudio = ?
    `,
    values
  );

  return r.affectedRows;
}

module.exports = { listByCP, getById, create, update };
