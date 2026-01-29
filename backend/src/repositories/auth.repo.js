const pool = require("../config/db");

async function findDocenteForLoginByUsername(nombre_usuario) {
  const [rows] = await pool.query(
    `SELECT id_docente, nombre_usuario, password, debe_cambiar_password, estado
     FROM docente
     WHERE nombre_usuario=? LIMIT 1`,
    [String(nombre_usuario).trim()]
  );
  return rows[0] || null;
}

async function getRolesByDocenteId(id_docente) {
  const [rows] = await pool.query(
    `SELECT id_rol
     FROM rol_docente
     WHERE id_docente=? AND estado=1
     ORDER BY id_rol ASC`,
    [Number(id_docente)]
  );
  return rows.map((r) => Number(r.id_rol));
}

async function getScopeCarreraForRol2(id_docente) {
  const [rows] = await pool.query(
    `SELECT id_carrera
     FROM carrera_docente
     WHERE id_docente=? AND estado=1
       AND tipo_admin IN ('DIRECTOR','APOYO')
     ORDER BY id_carrera_docente ASC
     LIMIT 1`,
    [Number(id_docente)]
  );
  return rows[0]?.id_carrera ?? null;
}

async function updatePasswordAndClearFlag(id_docente, passwordHash) {
  await pool.query(
    `UPDATE docente
     SET password=?, debe_cambiar_password=0, updated_at=CURRENT_TIMESTAMP
     WHERE id_docente=?`,
    [passwordHash, Number(id_docente)]
  );
  return true;
}

module.exports = {
  findDocenteForLoginByUsername,
  getRolesByDocenteId,
  getScopeCarreraForRol2,
  updatePasswordAndClearFlag,
};
