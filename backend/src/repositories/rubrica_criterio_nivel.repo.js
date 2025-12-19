const pool = require("../config/db");

async function componenteExists(id){ const [r]=await pool.query(`SELECT id_componente FROM componente WHERE id_componente=? LIMIT 1`, [id]); return !!r.length; }
async function criterioExists(id){ const [r]=await pool.query(`SELECT id_criterio FROM criterio WHERE id_criterio=? LIMIT 1`, [id]); return !!r.length; }
async function nivelExists(id){ const [r]=await pool.query(`SELECT id_nivel FROM nivel WHERE id_nivel=? LIMIT 1`, [id]); return !!r.length; }

async function findAll({ componenteId=null, includeInactive=false }={}){
  const where=[], params=[];
  if(!includeInactive) where.push("rcn.estado=1");
  if(componenteId){ where.push("rcn.id_componente=?"); params.push(+componenteId); }
  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows]=await pool.query(`
    SELECT rcn.*,
      c.nombre_componente,
      cr.nombre_criterio,
      n.nombre_nivel, n.valor_nivel
    FROM rubrica_criterio_nivel rcn
    JOIN componente c ON c.id_componente=rcn.id_componente
    JOIN criterio cr ON cr.id_criterio=rcn.id_criterio
    JOIN nivel n ON n.id_nivel=rcn.id_nivel
    ${ws}
    ORDER BY c.nombre_componente ASC, cr.orden_criterio ASC, n.orden_nivel ASC
  `, params);

  return rows;
}

async function findById(id){
  const [r]=await pool.query(`SELECT * FROM rubrica_criterio_nivel WHERE id_rubrica_criterio_nivel=?`, [id]);
  return r[0]||null;
}

async function create(d){
  const [res]=await pool.query(
    `INSERT INTO rubrica_criterio_nivel (id_componente, id_criterio, id_nivel, descripcion, estado)
     VALUES (?,?,?,?,1)`,
    [d.id_componente, d.id_criterio, d.id_nivel, d.descripcion]
  );
  return findById(res.insertId);
}

async function update(id, d){
  await pool.query(`UPDATE rubrica_criterio_nivel SET descripcion=? WHERE id_rubrica_criterio_nivel=?`, [d.descripcion, id]);
  return findById(id);
}

async function setEstado(id, estado){
  await pool.query(`UPDATE rubrica_criterio_nivel SET estado=? WHERE id_rubrica_criterio_nivel=?`, [estado?1:0, id]);
  return findById(id);
}

module.exports = {
  componenteExists, criterioExists, nivelExists,
  findAll, findById, create, update, setEstado
};
