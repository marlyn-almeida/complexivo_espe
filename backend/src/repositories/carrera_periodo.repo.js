const pool = require("../config/db");

// ---- Helpers de integridad ----
async function carreraExists(carreraId){
  const [r] = await pool.query(
    `SELECT id_carrera FROM carrera WHERE id_carrera=? LIMIT 1`,
    [carreraId]
  );
  return !!r.length;
}

async function periodoExists(periodoId){
  const [r] = await pool.query(
    `SELECT id_periodo FROM periodo_academico WHERE id_periodo=? LIMIT 1`,
    [periodoId]
  );
  return !!r.length;
}

// ---- Repo principal ----
async function exists(carreraId, periodoId){
  const [r]=await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo
     WHERE id_carrera=? AND id_periodo=? LIMIT 1`,
    [carreraId, periodoId]
  );
  return r[0]||null;
}

async function list({ carreraId=null, periodoId=null, includeInactive=false } = {}){
  const where=[], p=[];
  if(!includeInactive) where.push("cp.estado=1");
  if(carreraId){ where.push("cp.id_carrera=?"); p.push(+carreraId); }
  if(periodoId){ where.push("cp.id_periodo=?"); p.push(+periodoId); }
  const ws=where.length?`WHERE ${where.join(" AND ")}`:"";

  const [r]=await pool.query(
    `SELECT
        cp.*,
        c.nombre_carrera,
        c.codigo_carrera,
        c.sede,
        c.modalidad,
        pa.codigo_periodo,
        pa.fecha_inicio,
        pa.fecha_fin
     FROM carrera_periodo cp
     JOIN carrera c ON c.id_carrera=cp.id_carrera
     JOIN periodo_academico pa ON pa.id_periodo=cp.id_periodo
     ${ws}
     ORDER BY cp.created_at DESC`,
    p
  );
  return r;
}

async function create(carreraId, periodoId){
  // integridad mínima (mejor que fallar con FK/500)
  const okC = await carreraExists(carreraId);
  if(!okC){
    const e = new Error("carrera no existe");
    e.status = 422;
    throw e;
  }
  const okP = await periodoExists(periodoId);
  if(!okP){
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }

  // evitar duplicados antes de pegarle al UNIQUE/409
  const dup = await exists(carreraId, periodoId);
  if(dup){
    const e = new Error("La relación carrera_periodo ya existe");
    e.status = 409;
    throw e;
  }

  const [res]=await pool.query(
    `INSERT INTO carrera_periodo (id_carrera,id_periodo,estado)
     VALUES (?,?,1)`,
    [carreraId, periodoId]
  );

  const [r]=await pool.query(
    `SELECT * FROM carrera_periodo WHERE id_carrera_periodo=?`,
    [res.insertId]
  );
  return r[0];
}

async function setEstado(id,estado){
  await pool.query(
    `UPDATE carrera_periodo SET estado=? WHERE id_carrera_periodo=?`,
    [estado?1:0, id]
  );
  const [r]=await pool.query(
    `SELECT * FROM carrera_periodo WHERE id_carrera_periodo=?`,
    [id]
  );
  return r[0];
}

module.exports = {
  carreraExists,
  periodoExists,
  exists,
  list,
  create,
  setEstado
};
