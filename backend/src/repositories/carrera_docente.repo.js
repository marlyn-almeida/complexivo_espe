const pool = require("../config/db");

async function docenteExists(id_docente){
  const [r]=await pool.query(`SELECT id_docente FROM docente WHERE id_docente=? LIMIT 1`, [id_docente]);
  return !!r.length;
}

async function carreraPeriodoExists(id_carrera_periodo){
  const [r]=await pool.query(`SELECT id_carrera_periodo FROM carrera_periodo WHERE id_carrera_periodo=? LIMIT 1`, [id_carrera_periodo]);
  return !!r.length;
}

async function exists(id_docente, id_carrera_periodo){
  const [r]=await pool.query(
    `SELECT id_carrera_docente
     FROM carrera_docente
     WHERE id_docente=? AND id_carrera_periodo=? LIMIT 1`,
    [id_docente, id_carrera_periodo]
  );
  return r[0] || null;
}

async function findAll({ includeInactive=false, docenteId=null, carreraPeriodoId=null }={}) {
  const where=[], params=[];
  if (!includeInactive) where.push("cd.estado=1");
  if (docenteId){ where.push("cd.id_docente=?"); params.push(+docenteId); }
  if (carreraPeriodoId){ where.push("cd.id_carrera_periodo=?"); params.push(+carreraPeriodoId); }
  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows]=await pool.query(`
    SELECT
      cd.id_carrera_docente,
      cd.id_docente,
      cd.id_carrera_periodo,
      cd.estado,
      cd.created_at,
      cd.updated_at,
      d.nombres_docente, d.apellidos_docente, d.id_institucional_docente,
      c.nombre_carrera, c.codigo_carrera,
      pa.codigo_periodo
    FROM carrera_docente cd
    JOIN docente d ON d.id_docente = cd.id_docente
    JOIN carrera_periodo cp ON cp.id_carrera_periodo = cd.id_carrera_periodo
    JOIN carrera c ON c.id_carrera = cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo = cp.id_periodo
    ${ws}
    ORDER BY cd.created_at DESC
  `, params);

  return rows;
}

async function findById(id){
  const [r]=await pool.query(`SELECT * FROM carrera_docente WHERE id_carrera_docente=?`, [id]);
  return r[0] || null;
}

async function create(id_docente, id_carrera_periodo){
  const [res]=await pool.query(
    `INSERT INTO carrera_docente (id_docente, id_carrera_periodo, estado)
     VALUES (?,?,1)`,
    [id_docente, id_carrera_periodo]
  );
  return findById(res.insertId);
}

async function setEstado(id, estado){
  await pool.query(`UPDATE carrera_docente SET estado=? WHERE id_carrera_docente=?`, [estado?1:0, id]);
  return findById(id);
}

module.exports = { docenteExists, carreraPeriodoExists, exists, findAll, findById, create, setEstado };
