// ✅ src/repositories/tribunal_estudiante.repo.js
const pool = require("../config/db");

async function getTribunal(id_tribunal) {
  const [r] = await pool.query(
    `SELECT id_tribunal, id_carrera_periodo FROM tribunal WHERE id_tribunal=? LIMIT 1`,
    [id_tribunal]
  );
  return r[0] || null;
}

async function getTribunalEstudiante(id_tribunal_estudiante) {
  const [r] = await pool.query(
    `SELECT id_tribunal_estudiante, id_tribunal, id_estudiante, id_franja_horario, id_caso_estudio, estado, cerrado
     FROM tribunal_estudiante
     WHERE id_tribunal_estudiante=? LIMIT 1`,
    [id_tribunal_estudiante]
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

async function getFranjaFull(id_franja_horario) {
  const [r] = await pool.query(
    `
    SELECT id_franja_horario, id_carrera_periodo, fecha, hora_inicio, hora_fin, laboratorio
    FROM franja_horario
    WHERE id_franja_horario=? LIMIT 1
    `,
    [id_franja_horario]
  );
  return r[0] || null;
}

// ✅ NUEVO: caso desde caso_estudio (NO desde estudiante_caso_asignacion)
async function getCaso(id_caso_estudio) {
  const [r] = await pool.query(
    `SELECT id_caso_estudio, id_carrera_periodo FROM caso_estudio WHERE id_caso_estudio=? LIMIT 1`,
    [id_caso_estudio]
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

async function existsFranjaEnTribunal(id_tribunal, id_franja_horario) {
  const [r] = await pool.query(
    `SELECT id_tribunal_estudiante FROM tribunal_estudiante
     WHERE id_tribunal=? AND id_franja_horario=? AND estado=1 LIMIT 1`,
    [id_tribunal, id_franja_horario]
  );
  return r[0] || null;
}

async function existsFranjaOcupadaGlobal(id_franja_horario) {
  const [r] = await pool.query(
    `SELECT id_tribunal_estudiante
     FROM tribunal_estudiante
     WHERE id_franja_horario=? AND estado=1
     LIMIT 1`,
    [id_franja_horario]
  );
  return r[0] || null;
}

async function getDocentesByTribunal(id_tribunal) {
  const [rows] = await pool.query(
    `
    SELECT
      d.id_docente,
      td.designacion
    FROM tribunal_docente td
    JOIN carrera_docente cd ON cd.id_carrera_docente = td.id_carrera_docente
    JOIN docente d ON d.id_docente = cd.id_docente
    WHERE td.id_tribunal=?
      AND td.estado=1
      AND cd.estado=1
    `,
    [id_tribunal]
  );
  return rows;
}

async function existsConflictoHorarioDocente({ id_docente, fecha, hora_inicio, hora_fin }) {
  const [r] = await pool.query(
    `
    SELECT te2.id_tribunal_estudiante
    FROM tribunal_docente td2
    JOIN carrera_docente cd2 ON cd2.id_carrera_docente = td2.id_carrera_docente
    JOIN tribunal_estudiante te2 ON te2.id_tribunal = td2.id_tribunal
    JOIN franja_horario f2 ON f2.id_franja_horario = te2.id_franja_horario
    WHERE cd2.id_docente = ?
      AND cd2.estado = 1
      AND td2.estado = 1
      AND te2.estado = 1
      AND f2.fecha = ?
      AND (f2.hora_inicio < ? AND f2.hora_fin > ?)
    LIMIT 1
    `,
    [Number(id_docente), fecha, hora_fin, hora_inicio]
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
      te.id_caso_estudio,
      te.estado,
      te.cerrado,
      te.fecha_cierre,
      te.id_docente_cierra,
      te.created_at,
      te.updated_at,

      e.nombres_estudiante,
      e.apellidos_estudiante,
      e.id_institucional_estudiante,

      f.fecha,
      f.hora_inicio,
      f.hora_fin,
      f.laboratorio,

      t.nombre_tribunal,

      ce.numero_caso,
      ce.titulo AS titulo_caso,

      c.nombre_carrera,
      pa.codigo_periodo

    FROM tribunal_estudiante te
    JOIN tribunal t ON t.id_tribunal = te.id_tribunal
    JOIN carrera_periodo cp ON cp.id_carrera_periodo = t.id_carrera_periodo
    JOIN carrera c ON c.id_carrera = cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo = cp.id_periodo

    JOIN estudiante e ON e.id_estudiante = te.id_estudiante
    JOIN franja_horario f ON f.id_franja_horario = te.id_franja_horario

    LEFT JOIN caso_estudio ce
      ON ce.id_caso_estudio = te.id_caso_estudio

    ${ws}
    ORDER BY f.fecha DESC, f.hora_inicio DESC
    `,
    params
  );

  return rows;
}

async function create(d) {
  const [res] = await pool.query(
    `INSERT INTO tribunal_estudiante
      (id_tribunal, id_estudiante, id_franja_horario, id_caso_estudio, estado, cerrado)
     VALUES (?,?,?,?,1,0)`,
    [d.id_tribunal, d.id_estudiante, d.id_franja_horario, d.id_caso_estudio]
  );

  const [r] = await pool.query(
    `SELECT * FROM tribunal_estudiante WHERE id_tribunal_estudiante=?`,
    [res.insertId]
  );
  return r[0];
}

async function setEstado(id, estado) {
  await pool.query(
    `UPDATE tribunal_estudiante
     SET estado=?, updated_at=CURRENT_TIMESTAMP
     WHERE id_tribunal_estudiante=?`,
    [estado ? 1 : 0, id]
  );

  const [r] = await pool.query(
    `SELECT * FROM tribunal_estudiante WHERE id_tribunal_estudiante=?`,
    [id]
  );
  return r[0] || null;
}

// ✅ cerrar/abrir
async function setCerrado(id, cerrado, id_docente_cierra = null) {
  await pool.query(
    `
    UPDATE tribunal_estudiante
    SET
      cerrado=?,
      fecha_cierre=IF(?, NOW(), NULL),
      id_docente_cierra=IF(?, ?, NULL),
      updated_at=CURRENT_TIMESTAMP
    WHERE id_tribunal_estudiante=?
    `,
    [cerrado ? 1 : 0, cerrado ? 1 : 0, cerrado ? 1 : 0, id_docente_cierra, id]
  );

  const [r] = await pool.query(
    `SELECT * FROM tribunal_estudiante WHERE id_tribunal_estudiante=?`,
    [id]
  );
  return r[0] || null;
}

async function findMisAsignaciones({ id_docente, includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `
    SELECT
      te.id_tribunal_estudiante,
      te.id_tribunal,
      te.id_estudiante,
      te.id_franja_horario,
      te.id_caso_estudio,
      te.estado,
      te.cerrado,
      te.fecha_cierre,
      te.id_docente_cierra,
      te.created_at,
      te.updated_at,

      e.nombres_estudiante,
      e.apellidos_estudiante,
      e.id_institucional_estudiante,

      f.fecha,
      f.hora_inicio,
      f.hora_fin,
      f.laboratorio,

      t.nombre_tribunal,

      ce.numero_caso,
      ce.titulo AS titulo_caso,

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

    LEFT JOIN caso_estudio ce
      ON ce.id_caso_estudio = te.id_caso_estudio

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

// ✅ NUEVO: trae CASO + ENTREGA + mi_designacion para panel de notas
async function getContextoCalificar({ id_tribunal_estudiante, id_docente, cpCtx }) {
  const [rows] = await pool.query(
    `
    SELECT
      te.id_tribunal_estudiante,
      te.id_tribunal,
      te.id_estudiante,
      te.id_franja_horario,
      te.id_caso_estudio,
      te.estado,
      te.cerrado,

      t.id_carrera_periodo,
      t.nombre_tribunal,

      e.nombres_estudiante,
      e.apellidos_estudiante,
      e.id_institucional_estudiante,

      f.fecha,
      f.hora_inicio,
      f.hora_fin,
      f.laboratorio,

      td.designacion AS mi_designacion,

      ce.numero_caso,
      ce.titulo AS titulo_caso,
      ce.archivo_nombre AS caso_archivo_nombre,
      ce.archivo_path   AS caso_archivo_path,

      ece.archivo_nombre AS entrega_archivo_nombre,
      ece.archivo_path   AS entrega_archivo_path,
      ece.fecha_entrega,
      ece.observacion

    FROM tribunal_estudiante te
    JOIN tribunal t ON t.id_tribunal = te.id_tribunal
    JOIN estudiante e ON e.id_estudiante = te.id_estudiante
    JOIN franja_horario f ON f.id_franja_horario = te.id_franja_horario

    JOIN tribunal_docente td ON td.id_tribunal = te.id_tribunal AND td.estado = 1
    JOIN carrera_docente cd ON cd.id_carrera_docente = td.id_carrera_docente AND cd.estado = 1

    LEFT JOIN caso_estudio ce ON ce.id_caso_estudio = te.id_caso_estudio

    LEFT JOIN estudiante_caso_entrega ece
      ON ece.id_estudiante = te.id_estudiante
     AND ece.id_caso_estudio = te.id_caso_estudio
     AND ece.estado = 1

    WHERE te.id_tribunal_estudiante = ?
      AND cd.id_docente = ?
      AND te.estado = 1
      AND ( ? = 0 OR t.id_carrera_periodo = ? )
    LIMIT 1
    `,
    [Number(id_tribunal_estudiante), Number(id_docente), Number(cpCtx || 0), Number(cpCtx || 0)]
  );

  return rows[0] || null;
}

module.exports = {
  getTribunal,
  getTribunalEstudiante,
  getTribunalCarreraId,

  getEstudiante,
  getFranjaFull,
  getCaso,

  existsAsignacion,
  existsFranjaEnTribunal,
  existsFranjaOcupadaGlobal,

  getDocentesByTribunal,
  existsConflictoHorarioDocente,

  findAll,
  create,
  setEstado,
  setCerrado,
  findMisAsignaciones,

  // ✅ NUEVO
  getContextoCalificar,
};

