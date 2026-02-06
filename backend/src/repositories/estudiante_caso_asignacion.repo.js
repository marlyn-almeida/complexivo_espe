// src/repositories/estudiante_caso_asignacion.repo.js
const pool = require("../config/db");

async function existsEstudiante(id_estudiante) {
  const [r] = await pool.query(
    `SELECT id_estudiante, id_carrera_periodo FROM estudiante WHERE id_estudiante=? LIMIT 1`,
    [id_estudiante]
  );
  return r[0] || null;
}

async function existsCaso(id_caso_estudio) {
  const [r] = await pool.query(
    `SELECT id_caso_estudio, id_carrera_periodo FROM caso_estudio WHERE id_caso_estudio=? LIMIT 1`,
    [id_caso_estudio]
  );
  return r[0] || null;
}

// ✅ lista asignaciones dentro del CP (contexto)
async function findAllByCP(id_carrera_periodo, { includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `
    SELECT
      eca.id_estudiante_caso_asignacion,
      eca.id_estudiante,
      eca.id_caso_estudio,
      eca.estado,
      eca.created_at,
      eca.updated_at,

      e.id_institucional_estudiante,
      e.nombres_estudiante,
      e.apellidos_estudiante,

      ce.numero_caso,
      ce.titulo,
      ce.descripcion,
      ce.archivo_nombre,
      ce.archivo_path

    FROM estudiante_caso_asignacion eca
    JOIN estudiante e ON e.id_estudiante = eca.id_estudiante
    JOIN caso_estudio ce ON ce.id_caso_estudio = eca.id_caso_estudio
    WHERE e.id_carrera_periodo = ?
      AND ce.id_carrera_periodo = ?
      AND (? = 1 OR eca.estado = 1)
    ORDER BY e.apellidos_estudiante ASC, e.nombres_estudiante ASC
    `,
    [Number(id_carrera_periodo), Number(id_carrera_periodo), includeInactive ? 1 : 0]
  );
  return rows;
}

async function findByEstudiante(id_estudiante) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM estudiante_caso_asignacion
    WHERE id_estudiante=?
    LIMIT 1
    `,
    [Number(id_estudiante)]
  );
  return rows[0] || null;
}

async function findById(id_estudiante_caso_asignacion) {
  const [rows] = await pool.query(
    `SELECT * FROM estudiante_caso_asignacion WHERE id_estudiante_caso_asignacion=?`,
    [Number(id_estudiante_caso_asignacion)]
  );
  return rows[0] || null;
}

async function create({ id_estudiante, id_caso_estudio }) {
  const [res] = await pool.query(
    `
    INSERT INTO estudiante_caso_asignacion (id_estudiante, id_caso_estudio, estado)
    VALUES (?,?,1)
    `,
    [Number(id_estudiante), Number(id_caso_estudio)]
  );
  return findById(res.insertId);
}

async function updateByEstudiante(id_estudiante, { id_caso_estudio }) {
  await pool.query(
    `
    UPDATE estudiante_caso_asignacion
    SET id_caso_estudio=?,
        updated_at=CURRENT_TIMESTAMP
    WHERE id_estudiante=?
    `,
    [Number(id_caso_estudio), Number(id_estudiante)]
  );
  return findByEstudiante(id_estudiante);
}

async function setEstadoByEstudiante(id_estudiante, estado) {
  await pool.query(
    `
    UPDATE estudiante_caso_asignacion
    SET estado=?,
        updated_at=CURRENT_TIMESTAMP
    WHERE id_estudiante=?
    `,
    [estado ? 1 : 0, Number(id_estudiante)]
  );
  return findByEstudiante(id_estudiante);
}

module.exports = {
  existsEstudiante,
  existsCaso,
  findAllByCP,
  findByEstudiante,
  create,
  updateByEstudiante,
  setEstadoByEstudiante,
};
