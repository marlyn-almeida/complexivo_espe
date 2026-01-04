// src/repositories/auth.repo.js
const pool = require("../config/db");

async function findDocenteForLoginByUsername(nombre_usuario) {
  const [rows] = await pool.query(
    `SELECT id_docente, nombre_usuario, password, estado
     FROM docente
     WHERE nombre_usuario=? LIMIT 1`,
    [nombre_usuario]
  );
  return rows[0] || null;
}

async function getRolesByDocenteId(id_docente) {
  const [rows] = await pool.query(
    `SELECT id_rol
     FROM rol_docente
     WHERE id_docente=? AND estado=1
     ORDER BY id_rol ASC`,
    [id_docente]
  );
  return rows.map(r => Number(r.id_rol));
}

/**
 * Scope para rol 2: carrera “administrada” por el docente.
 * Si tu lógica es “DIRECTOR/APOYO”, filtra por tipo_admin.
 */
async function getScopeCarreraForRol2(id_docente) {
  const [rows] = await pool.query(
    `SELECT id_carrera
     FROM carrera_docente
     WHERE id_docente=? AND estado=1
       AND tipo_admin IN ('DIRECTOR','APOYO')
     ORDER BY id_carrera_docente ASC
     LIMIT 1`,
    [id_docente]
  );
  return rows[0]?.id_carrera ?? null;
}

module.exports = {
  findDocenteForLoginByUsername,
  getRolesByDocenteId,
  getScopeCarreraForRol2,
};
