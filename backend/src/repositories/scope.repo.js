const db = require("../config/db");

async function getAdminScopeByDocenteId(idDocente) {
  const [rows] = await db.query(
    `
    SELECT cd.id_carrera, cd.tipo_admin
    FROM carrera_docente cd
    WHERE cd.id_docente = ?
      AND cd.estado = 1
      AND cd.tipo_admin IN ('DIRECTOR','APOYO')
    LIMIT 1
    `,
    [idDocente]
  );

  return rows[0] || null;
}

module.exports = { getAdminScopeByDocenteId };
