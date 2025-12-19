const pool = require("../config/db");

async function getTribunal(id_tribunal){
  const [r] = await pool.query(
    `SELECT id_tribunal, id_carrera_periodo FROM tribunal WHERE id_tribunal=? LIMIT 1`,
    [id_tribunal]
  );
  return r[0] || null;
}

async function getEstudiante(id_estudiante){
  const [r] = await pool.query(
    `SELECT id_estudiante, id_carrera_periodo FROM estudiante WHERE id_estudiante=? LIMIT 1`,
    [id_estudiante]
  );
  return r[0] || null;
}

async function getFranja(id_franja_horario){
  const [r] = await pool.query(
    `SELECT id_franja_horario, id_carrera_periodo FROM franja_horario WHERE id_franja_horario=? LIMIT 1`,
    [id_franja_horario]
  );
  return r[0] || null;
}

async function existsAsignacion(id_tribunal, id_estudiante){
  const [r] = await pool.query(
    `SELECT id_tribunal_estudiante FROM tribunal_estudiante
     WHERE id_tribunal=? AND id_estudiante=? LIMIT 1`,
    [id_tribunal, id_estudiante]
  );
  return r[0] || null;
}

async function findAll({ tribunalId=null, includeInactive=false }={}) {
  const where=[], params=[];
  if (!includeInactive) where.push("te.estado=1");
  if (tribunalId){ where.push("te.id_tribunal=?"); params.push(+tribunalId); }
  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(`
    SELECT
      te.*,
      e.nombres_estudiante, e.apellidos_estudiante, e.id_institucional_estudiante,
      f.fecha, f.hora_inicio, f.hora_fin, f.laboratorio
    FROM tribunal_estudiante te
    JOIN estudiante e ON e.id_estudiante=te.id_estudiante
    JOIN franja_horario f ON f.id_franja_horario=te.id_franja_horario
    ${ws}
    ORDER BY te.created_at DESC
  `, params);

  return rows;
}

async function create(d){
  const [res] = await pool.query(
    `INSERT INTO tribunal_estudiante (id_tribunal, id_estudiante, id_franja_horario, estado)
     VALUES (?,?,?,1)`,
    [d.id_tribunal, d.id_estudiante, d.id_franja_horario]
  );
  const [r] = await pool.query(`SELECT * FROM tribunal_estudiante WHERE id_tribunal_estudiante=?`, [res.insertId]);
  return r[0];
}

async function setEstado(id, estado){
  await pool.query(`UPDATE tribunal_estudiante SET estado=? WHERE id_tribunal_estudiante=?`, [estado?1:0, id]);
  const [r] = await pool.query(`SELECT * FROM tribunal_estudiante WHERE id_tribunal_estudiante=?`, [id]);
  return r[0] || null;
}

module.exports = {
  getTribunal, getEstudiante, getFranja,
  existsAsignacion,
  findAll, create, setEstado
};
