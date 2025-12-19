const pool = require("../config/db");

async function getTribunalEstudiante(id_tribunal_estudiante) {
  const [r] = await pool.query(
    `SELECT te.id_tribunal_estudiante, t.id_carrera_periodo
     FROM tribunal_estudiante te
     JOIN tribunal t ON t.id_tribunal = te.id_tribunal
     WHERE te.id_tribunal_estudiante=? LIMIT 1`,
    [id_tribunal_estudiante]
  );
  return r[0] || null;
}

async function getRubrica(id_rubrica) {
  const [r] = await pool.query(
    `SELECT id_rubrica, id_carrera_periodo
     FROM rubrica
     WHERE id_rubrica=? LIMIT 1`,
    [id_rubrica]
  );
  return r[0] || null;
}

async function findAll({ includeInactive=false, tribunalEstudianteId=null, rubricaId=null } = {}) {
  const where=[], params=[];
  if (!includeInactive) where.push("c.estado=1");
  if (tribunalEstudianteId) { where.push("c.id_tribunal_estudiante=?"); params.push(+tribunalEstudianteId); }
  if (rubricaId) { where.push("c.id_rubrica=?"); params.push(+rubricaId); }
  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(`
    SELECT c.*
    FROM calificacion c
    ${ws}
    ORDER BY c.created_at DESC
  `, params);
  return rows;
}

async function findById(id) {
  const [r] = await pool.query(`SELECT * FROM calificacion WHERE id_calificacion=?`, [id]);
  return r[0] || null;
}

async function findOneByKey(id_tribunal_estudiante, id_rubrica, tipo_rubrica) {
  const [r] = await pool.query(
    `SELECT * FROM calificacion
     WHERE id_tribunal_estudiante=? AND id_rubrica=? AND tipo_rubrica=? LIMIT 1`,
    [id_tribunal_estudiante, id_rubrica, tipo_rubrica]
  );
  return r[0] || null;
}

async function create(d) {
  const [res] = await pool.query(
    `INSERT INTO calificacion
      (id_tribunal_estudiante, id_rubrica, tipo_rubrica, nota_base20, observacion, estado)
     VALUES (?,?,?,?,?,1)`,
    [d.id_tribunal_estudiante, d.id_rubrica, d.tipo_rubrica, d.nota_base20, d.observacion ?? null]
  );
  return findById(res.insertId);
}

async function update(id, d) {
  await pool.query(
    `UPDATE calificacion
     SET tipo_rubrica=?, nota_base20=?, observacion=?
     WHERE id_calificacion=?`,
    [d.tipo_rubrica, d.nota_base20, d.observacion ?? null, id]
  );
  return findById(id);
}

async function upsertByKey(d) {
  const existing = await findOneByKey(d.id_tribunal_estudiante, d.id_rubrica, d.tipo_rubrica);
  if (!existing) return create(d);
  return update(existing.id_calificacion, d);
}

async function setEstado(id, estado) {
  await pool.query(`UPDATE calificacion SET estado=? WHERE id_calificacion=?`, [estado?1:0, id]);
  return findById(id);
}

module.exports = {
  getTribunalEstudiante,
  getRubrica,
  findAll,
  findById,
  findOneByKey,
  create,
  update,
  upsertByKey,
  setEstado
};
