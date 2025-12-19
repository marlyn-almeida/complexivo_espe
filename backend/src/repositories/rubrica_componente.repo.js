const pool = require("../config/db");

async function rubricaExists(id_rubrica){
  const [r]=await pool.query(`SELECT id_rubrica FROM rubrica WHERE id_rubrica=? LIMIT 1`, [id_rubrica]);
  return !!r.length;
}
async function componenteExists(id_componente){
  const [r]=await pool.query(`SELECT id_componente FROM componente WHERE id_componente=? LIMIT 1`, [id_componente]);
  return !!r.length;
}

async function findAll({ rubricaId=null, includeInactive=false }={}){
  const where=[], params=[];
  if(!includeInactive) where.push("rc.estado=1");
  if(rubricaId){ where.push("rc.id_rubrica=?"); params.push(+rubricaId); }
  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows]=await pool.query(`
    SELECT rc.*, c.nombre_componente
    FROM rubrica_componente rc
    JOIN componente c ON c.id_componente=rc.id_componente
    ${ws}
    ORDER BY rc.orden_componente ASC
  `, params);
  return rows;
}

async function findById(id){
  const [r]=await pool.query(`SELECT * FROM rubrica_componente WHERE id_rubrica_componente=?`, [id]);
  return r[0]||null;
}

async function create(d){
  const [res]=await pool.query(
    `INSERT INTO rubrica_componente (id_rubrica, id_componente, ponderacion_porcentaje, orden_componente, estado)
     VALUES (?,?,?,?,1)`,
    [d.id_rubrica, d.id_componente, d.ponderacion_porcentaje, d.orden_componente]
  );
  return findById(res.insertId);
}

async function update(id, d){
  await pool.query(
    `UPDATE rubrica_componente
     SET ponderacion_porcentaje=?, orden_componente=?
     WHERE id_rubrica_componente=?`,
    [d.ponderacion_porcentaje, d.orden_componente, id]
  );
  return findById(id);
}

async function setEstado(id, estado){
  await pool.query(`UPDATE rubrica_componente SET estado=? WHERE id_rubrica_componente=?`, [estado?1:0, id]);
  return findById(id);
}

module.exports = { rubricaExists, componenteExists, findAll, findById, create, update, setEstado };
