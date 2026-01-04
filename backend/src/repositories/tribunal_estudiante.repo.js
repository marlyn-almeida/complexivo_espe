// src/repositories/tribunal_estudiante.repo.js
const pool = require("../config/db");

async function getTribunal(id_tribunal) {
  const [r] = await pool.query(
    `SELECT id_tribunal, id_carrera_periodo FROM tribunal WHERE id_tribunal=? LIMIT 1`,
    [id_tribunal]
  );
  return r[0] || null;
}

async function getTribunalCarreraId(id_tribunal) {
  const [r] = await pool.query(
    `
    SELECT c.id_carrera
    FROM tribunal t
    JOIN carrera_periodo cp ON cp.id_carrera_periodo=t.id_carrera_periodo
    JOIN carrera c ON c.id_carrera=cp.id_carrera
    WHERE t.id_tribunal=?
    LIMIT 1
  `,
    [id_tribunal]
  );
  return r[0]?.id_carrera ?? null;
}

async function getEstudiante(id_estudiante) {
  const [r] = await pool.query(
    `SELECT id_estudiante, id_carrera_periodo FROM estudiante WHERE id_estudiante=? LIMIT 1`,
    [id_estudiante]
  );
  return r[0] || null;
}

async function getFranja(id_franja_horario) {
  const [r] = await pool.query(
    `SELECT id_franja_horario, id_carrera_periodo FROM franja_horario WHERE id_franja_horario=? LIMIT 1`,
    [id_franja_horario]
  );
  return r[0] || null;
}

async function existsAsignacion(id_tribunal, id_estudiante) {
  const [r] = await pool.query(
    `SELECT id_tribunal_estudiante FROM tribunal_estudiante
     WHERE id_tribunal=? AND id_estudiante=? LIMIT 1`,
    [id_tribunal, id_estudiante]
  );
  return r[0] || null;
}

// ✅ evita que el mismo tribunal use la misma franja 2 veces
async function existsFranjaEnTribunal(id_tribunal, id_franja_horario) {
  const [r] = await pool.query(
    `SELECT id_tribunal_estudiante FROM tribunal_estudiante
     WHERE id_tribunal=? AND id_franja_horario=? AND estado=1 LIMIT 1`,
    [id_tribunal, id_franja_horario]
  );
  return r[0] || null;
}

async function findAll({ tribunalId = null, includeInactive = false, scopeCarreraId = null } = {}) {
  const where = [];
  const params = [];

  if (!includeInactive) where.push("te.estado=1");
  if (tribunalId) {
    where.push("te.id_tribunal=?");
    params.push(+tribunalId);
  }

  // ✅ scope: restringe por carrera del tribunal (rol 2)
  if (scopeCarreraId) {
    where.push("c.id_carrera=?");
    params.push(+scopeCarreraId);
  }

  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `
    SELECT
      te.id_tribunal_estudiante,
      te.id_tribunal,
      te.id_estudiante,
      te.id_franja_horario,
      te.estado,
      te.created_at,
      te.updated_at,

      e.nombres_estudiante,
      e.apellidos_estudiante,
      e.id_institucional_estudiante,

      f.fecha,
      f.hora_inicio,
      f.hora_fin,
      f.laboratorio,

      t.caso,
      t.nombre_tribunal,

      c.nombre_carrera,
      pa.codigo_periodo

    FROM tribunal_estudiante te
    JOIN tribunal t ON t.id_tribunal = te.id_tribunal
    JOIN carrera_periodo cp ON cp.id_carrera_periodo = t.id_carrera_periodo
    JOIN carrera c ON c.id_carrera = cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo = cp.id_periodo

    JOIN estudiante e ON e.id_estudiante=te.id_estudiante
    JOIN franja_horario f ON f.id_franja_horario=te.id_franja_horario

    ${ws}
    ORDER BY f.fecha DESC, f.hora_inicio DESC
  `,
    params
  );

  return rows;
}

async function create(d) {
  const [res] = await pool.query(
    `INSERT INTO tribunal_estudiante (id_tribunal, id_estudiante, id_franja_horario, estado)
     VALUES (?,?,?,1)`,
    [d.id_tribunal, d.id_estudiante, d.id_franja_horario]
  );

  const [r] = await pool.query(`SELECT * FROM tribunal_estudiante WHERE id_tribunal_estudiante=?`, [
    res.insertId,
  ]);
  return r[0];
}

async function setEstado(id, estado) {
  await pool.query(`UPDATE tribunal_estudiante SET estado=? WHERE id_tribunal_estudiante=?`, [
    estado ? 1 : 0,
    id,
  ]);
  const [r] = await pool.query(`SELECT * FROM tribunal_estudiante WHERE id_tribunal_estudiante=?`, [id]);
  return r[0] || null;
}

// ✅ NUEVO: Mis asignaciones (ROL 3)
// Filtra por docente a través de tribunal_docente -> carrera_docente -> id_docente.
async function findMisAsignaciones({ id_docente, includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `
    SELECT
      te.id_tribunal_estudiante,
      te.id_tribunal,
      te.id_estudiante,
      te.id_franja_horario,
      te.estado,
      te.created_at,
      te.updated_at,

      e.nombres_estudiante,
      e.apellidos_estudiante,
      e.id_institucional_estudiante,

      f.fecha,
      f.hora_inicio,
      f.hora_fin,
      f.laboratorio,

      t.caso,
      t.nombre_tribunal,

      c.nombre_carrera,
      pa.codigo_periodo,

      td.designacion

    FROM tribunal_docente td
    JOIN carrera_docente cd ON cd.id_carrera_docente = td.id_carrera_docente
    JOIN tribunal t ON t.id_tribunal = td.id_tribunal
    JOIN tribunal_estudiante te ON te.id_tribunal = t.id_tribunal

    JOIN carrera_periodo cp ON cp.id_carrera_periodo = t.id_carrera_periodo
    JOIN carrera c ON c.id_carrera = cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo = cp.id_periodo

    JOIN estudiante e ON e.id_estudiante = te.id_estudiante
    JOIN franja_horario f ON f.id_franja_horario = te.id_franja_horario

    WHERE cd.id_docente = ?
      AND cd.estado = 1
      AND td.estado = 1
      AND (? = 1 OR te.estado = 1)
    ORDER BY f.fecha DESC, f.hora_inicio DESC
    `,
    [Number(id_docente), includeInactive ? 1 : 0]
  );

  return rows;
}

module.exports = {
  getTribunal,
  getTribunalCarreraId,
  getEstudiante,
  getFranja,
  existsAsignacion,
  existsFranjaEnTribunal,
  findAll,
  create,
  setEstado,
  findMisAsignaciones, // ✅ NUEVO
};
