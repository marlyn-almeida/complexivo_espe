// src/repositories/docenteRoles.repo.js
const pool = require("../config/db");

async function getAllRoles({ includeInactive = true } = {}) {
  const whereSql = includeInactive ? "" : "WHERE estado=1";
  const [rows] = await pool.query(
    `SELECT id_rol, nombre_rol, descripcion_rol, estado
     FROM rol
     ${whereSql}
     ORDER BY id_rol ASC`
  );
  return rows;
}

async function getActiveRoleIdsByDocente(id_docente) {
  const [rows] = await pool.query(
    `SELECT id_rol
     FROM rol_docente
     WHERE id_docente=? AND estado=1
     ORDER BY id_rol ASC`,
    [Number(id_docente)]
  );
  return rows.map((r) => Number(r.id_rol));
}

async function upsertRolDocenteEstado({ id_docente, id_rol, estado }) {
  await pool.query(
    `INSERT INTO rol_docente (id_rol, id_docente, estado)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE estado=VALUES(estado), updated_at=CURRENT_TIMESTAMP`,
    [Number(id_rol), Number(id_docente), estado ? 1 : 0]
  );
  return true;
}

async function hasActiveDirectorOrApoyo(id_docente) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM carrera_docente
     WHERE id_docente = ?
       AND estado = 1
       AND tipo_admin IN ('DIRECTOR','APOYO')
     LIMIT 1`,
    [Number(id_docente)]
  );
  return rows.length > 0;
}

module.exports = {
  getAllRoles,
  getActiveRoleIdsByDocente,
  upsertRolDocenteEstado,
  hasActiveDirectorOrApoyo,
};
