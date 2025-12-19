const pool = require("../config/db");

const TABLE = "periodo_academico";

async function findAll({ includeInactive=false, q="", page=1, limit=50 }={}) {
  const safeLimit = Math.min(Math.max(+limit||50,1),100);
  const safePage = Math.max(+page||1,1);
  const offset = (safePage-1)*safeLimit;

  const where=[], params=[];
  if (!includeInactive) where.push("estado=1");
  if (q && q.trim()) {
    where.push("(codigo_periodo LIKE ? OR IFNULL(descripcion_periodo,'') LIKE ?)");
    const like=`%${q.trim()}%`; params.push(like, like);
  }
  const whereSql = where.length?`WHERE ${where.join(" AND ")}`:"";

  const sql = `
    SELECT id_periodo, codigo_periodo, descripcion_periodo, fecha_inicio, fecha_fin, estado, created_at, updated_at
    FROM ${TABLE} ${whereSql}
    ORDER BY fecha_inicio DESC
    LIMIT ? OFFSET ?`;
  params.push(safeLimit, offset);

  const [rows]=await pool.query(sql, params);
  return rows;
}

async function findById(id){
  const [r]=await pool.query(`SELECT * FROM ${TABLE} WHERE id_periodo=?`, [id]);
  return r[0]||null;
}

async function findByCodigo(codigo){
  const [r]=await pool.query(`SELECT id_periodo FROM ${TABLE} WHERE codigo_periodo=? LIMIT 1`, [codigo]);
  return r[0]||null;
}

async function create(d){
  const [res]=await pool.query(
    `INSERT INTO ${TABLE}
     (codigo_periodo, descripcion_periodo, fecha_inicio, fecha_fin, estado)
     VALUES (?,?,?,?,1)`,
    [d.codigo_periodo, d.descripcion_periodo||null, d.fecha_inicio, d.fecha_fin]
  );
  return findById(res.insertId);
}

async function update(id,d){
  await pool.query(
    `UPDATE ${TABLE}
     SET codigo_periodo=?, descripcion_periodo=?, fecha_inicio=?, fecha_fin=?
     WHERE id_periodo=?`,
    [d.codigo_periodo, d.descripcion_periodo||null, d.fecha_inicio, d.fecha_fin, id]
  );
  return findById(id);
}

async function setEstado(id,estado){
  await pool.query(`UPDATE ${TABLE} SET estado=? WHERE id_periodo=?`, [estado?1:0, id]);
  return findById(id);
}

module.exports={ findAll, findById, findByCodigo, create, update, setEstado };
