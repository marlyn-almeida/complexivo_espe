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
      fields.push(`${k} = ?`);
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

/** ✅ NUEVO: borrado real */
async function remove(id_caso_estudio) {
  const [r] = await pool.query(
    `DELETE FROM caso_estudio WHERE id_caso_estudio = ?`,
    [id_caso_estudio]
  );
  return r.affectedRows;
}

/**
 * ✅ PERMISO DOCENTE (CORREGIDO)
 * DOCENTE puede ver/descargar el CASO si:
 * - pertenece a un tribunal activo
 * - y ese tribunal tiene asignaciones activas (tribunal_estudiante)
 * - y la asignación tiene ese mismo id_caso_estudio
 * - y todo está dentro del carrera_periodo (cp) activo
 */
async function docentePuedeVerCaso({ id_docente, id_caso_estudio, id_carrera_periodo }) {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM tribunal_docente td
    JOIN carrera_docente cd ON cd.id_carrera_docente = td.id_carrera_docente
    JOIN tribunal t ON t.id_tribunal = td.id_tribunal
    JOIN tribunal_estudiante te ON te.id_tribunal = t.id_tribunal
    WHERE cd.id_docente = ?
      AND cd.estado = 1
      AND td.estado = 1
      AND t.estado = 1
      AND te.estado = 1
      AND t.id_carrera_periodo = ?
      AND te.id_caso_estudio = ?
    LIMIT 1
    `,
    [Number(id_docente), Number(id_carrera_periodo), Number(id_caso_estudio)]
  );

  return !!rows.length;
}

module.exports = { listByCP, getById, create, update, remove, docentePuedeVerCaso };
