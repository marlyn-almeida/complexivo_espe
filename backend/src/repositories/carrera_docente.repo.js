const pool = require("../config/db");

async function docenteExists(id_docente) {
  const [r] = await pool.query(
    `SELECT id_docente FROM docente WHERE id_docente=? LIMIT 1`,
    [id_docente]
  );
  return !!r.length;
}

async function carreraExists(id_carrera) {
  const [r] = await pool.query(
    `SELECT id_carrera FROM carrera WHERE id_carrera=? LIMIT 1`,
    [id_carrera]
  );
  return !!r.length;
}

async function exists(id_docente, id_carrera, tipo_admin = "DOCENTE") {
  const [r] = await pool.query(
    `SELECT id_carrera_docente
     FROM carrera_docente
     WHERE id_docente=? AND id_carrera=? AND tipo_admin=? LIMIT 1`,
    [id_docente, id_carrera, tipo_admin]
  );
  return r[0] || null;
}

async function findAll({ includeInactive = false, docenteId = null, carreraId = null } = {}) {
  const where = [];
  const params = [];
  if (!includeInactive) where.push("cd.estado=1");
  if (docenteId) { where.push("cd.id_docente=?"); params.push(+docenteId); }
  if (carreraId) { where.push("cd.id_carrera=?"); params.push(+carreraId); }
  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `
    SELECT
      cd.id_carrera_docente,
      cd.id_docente,
      cd.id_carrera,
      cd.tipo_admin,
      cd.estado,
      cd.created_at,
      cd.updated_at,
      d.nombres_docente,
      d.apellidos_docente,
      d.id_institucional_docente,
      c.nombre_carrera,
      c.codigo_carrera
    FROM carrera_docente cd
    JOIN docente d ON d.id_docente = cd.id_docente
    JOIN carrera c ON c.id_carrera = cd.id_carrera
    ${ws}
    ORDER BY cd.created_at DESC
    `,
    params
  );

  return rows;
}

async function findById(id) {
  const [r] = await pool.query(
    `SELECT * FROM carrera_docente WHERE id_carrera_docente=?`,
    [id]
  );
  return r[0] || null;
}

async function create({ id_docente, id_carrera, tipo_admin = "DOCENTE" }) {
  const [res] = await pool.query(
    `INSERT INTO carrera_docente (id_docente, id_carrera, tipo_admin, estado)
     VALUES (?,?,?,1)`,
    [id_docente, id_carrera, tipo_admin]
  );
  return findById(res.insertId);
}

async function setEstado(id, estado) {
  await pool.query(
    `UPDATE carrera_docente SET estado=? WHERE id_carrera_docente=?`,
    [estado ? 1 : 0, id]
  );
  return findById(id);
}

module.exports = {
  docenteExists,
  carreraExists,
  exists,
  findAll,
  findById,
  create,
  setEstado,
};
