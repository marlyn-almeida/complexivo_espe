const pool = require("../config/db");

async function findAll({ includeInactive=false }={}){
  const [rows]=await pool.query(
    `SELECT * FROM componente ${includeInactive?"":"WHERE estado=1"} ORDER BY nombre_componente ASC`
  );
  return rows;
}
async function findById(id){
  const [r]=await pool.query(`SELECT * FROM componente WHERE id_componente=?`, [id]);
  return r[0]||null;
}
async function create(d){
  const [res]=await pool.query(`INSERT INTO componente (nombre_componente, estado) VALUES (?,1)`, [d.nombre_componente]);
  return findById(res.insertId);
}
async function update(id, d){
  await pool.query(`UPDATE componente SET nombre_componente=? WHERE id_componente=?`, [d.nombre_componente, id]);
  return findById(id);
}
async function setEstado(id, estado){
  await pool.query(`UPDATE componente SET estado=? WHERE id_componente=?`, [estado?1:0, id]);
  return findById(id);
}
module.exports = { findAll, findById, create, update, setEstado };
