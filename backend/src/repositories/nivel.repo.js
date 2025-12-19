const pool = require("../config/db");

async function findAll({ includeInactive=false }={}){
  const [rows]=await pool.query(
    `SELECT * FROM nivel ${includeInactive?"":"WHERE estado=1"} ORDER BY orden_nivel ASC, valor_nivel ASC`
  );
  return rows;
}
async function findById(id){
  const [r]=await pool.query(`SELECT * FROM nivel WHERE id_nivel=?`, [id]);
  return r[0]||null;
}
async function create(d){
  const [res]=await pool.query(
    `INSERT INTO nivel (nombre_nivel, valor_nivel, orden_nivel, estado) VALUES (?,?,?,1)`,
    [d.nombre_nivel, d.valor_nivel, d.orden_nivel ?? 1]
  );
  return findById(res.insertId);
}
async function update(id, d){
  await pool.query(
    `UPDATE nivel SET nombre_nivel=?, valor_nivel=?, orden_nivel=? WHERE id_nivel=?`,
    [d.nombre_nivel, d.valor_nivel, d.orden_nivel ?? 1, id]
  );
  return findById(id);
}
async function setEstado(id, estado){
  await pool.query(`UPDATE nivel SET estado=? WHERE id_nivel=?`, [estado?1:0, id]);
  return findById(id);
}
module.exports = { findAll, findById, create, update, setEstado };
