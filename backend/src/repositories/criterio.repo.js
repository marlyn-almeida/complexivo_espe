const pool = require("../config/db");

async function findAll({ includeInactive=false }={}){
  const [rows]=await pool.query(
    `SELECT * FROM criterio ${includeInactive?"":"WHERE estado=1"} ORDER BY orden_criterio ASC, nombre_criterio ASC`
  );
  return rows;
}
async function findById(id){
  const [r]=await pool.query(`SELECT * FROM criterio WHERE id_criterio=?`, [id]);
  return r[0]||null;
}
async function create(d){
  const [res]=await pool.query(
    `INSERT INTO criterio (nombre_criterio, orden_criterio, estado) VALUES (?,?,1)`,
    [d.nombre_criterio, d.orden_criterio ?? 1]
  );
  return findById(res.insertId);
}
async function update(id, d){
  await pool.query(`UPDATE criterio SET nombre_criterio=?, orden_criterio=? WHERE id_criterio=?`,
    [d.nombre_criterio, d.orden_criterio ?? 1, id]
  );
  return findById(id);
}
async function setEstado(id, estado){
  await pool.query(`UPDATE criterio SET estado=? WHERE id_criterio=?`, [estado?1:0, id]);
  return findById(id);
}
module.exports = { findAll, findById, create, update, setEstado };
