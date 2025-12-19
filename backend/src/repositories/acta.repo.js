const pool = require("../config/db");

async function findByCalificacion(id_calificacion){
  const [r] = await pool.query(`SELECT * FROM acta WHERE id_calificacion=? LIMIT 1`, [id_calificacion]);
  return r[0] || null;
}

async function findById(id){
  const [r] = await pool.query(`SELECT * FROM acta WHERE id_acta=?`, [id]);
  return r[0] || null;
}

async function create(d){
  const [res] = await pool.query(
    `INSERT INTO acta
      (id_calificacion, nota_teorico_20, nota_practico_escrita_20, nota_practico_oral_20,
       calificacion_final, calificacion_final_letras, aprobacion, fecha_acta, estado_acta, estado)
     VALUES (?,?,?,?,?,?,?,?,?,1)`,
    [
      d.id_calificacion,
      d.nota_teorico_20 ?? null,
      d.nota_practico_escrita_20 ?? null,
      d.nota_practico_oral_20 ?? null,
      d.calificacion_final ?? null,
      d.calificacion_final_letras ?? null,
      d.aprobacion ?? null,
      d.fecha_acta ?? null,
      d.estado_acta ?? "BORRADOR"
    ]
  );
  return findById(res.insertId);
}

async function updateById(id, d){
  await pool.query(
    `UPDATE acta SET
      nota_teorico_20=?,
      nota_practico_escrita_20=?,
      nota_practico_oral_20=?,
      calificacion_final=?,
      calificacion_final_letras=?,
      aprobacion=?,
      fecha_acta=?,
      estado_acta=?
     WHERE id_acta=?`,
    [
      d.nota_teorico_20 ?? null,
      d.nota_practico_escrita_20 ?? null,
      d.nota_practico_oral_20 ?? null,
      d.calificacion_final ?? null,
      d.calificacion_final_letras ?? null,
      d.aprobacion ?? null,
      d.fecha_acta ?? null,
      d.estado_acta ?? "BORRADOR",
      id
    ]
  );
  return findById(id);
}

async function setEstado(id, estado){
  await pool.query(`UPDATE acta SET estado=? WHERE id_acta=?`, [estado?1:0, id]);
  return findById(id);
}

module.exports = { findByCalificacion, findById, create, updateById, setEstado };
