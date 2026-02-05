const pool = require("../config/db");

async function list({ includeInactive = false, periodoId = null } = {}) {
  const where = [];
  const params = [];

  if (periodoId) {
    where.push("r.id_periodo = ?");
    params.push(Number(periodoId));
  }

  if (!includeInactive) {
    where.push("r.estado = 1");
  }

  const sql = `
    SELECT
      r.id_rubrica,
      r.id_periodo,
      r.ponderacion_global,
      r.nombre_rubrica,
      r.descripcion_rubrica,
      r.estado,
      r.created_at,
      r.updated_at
    FROM rubrica r
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY r.id_rubrica ASC
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getByPeriodo(id_periodo) {
  const [rows] = await pool.query(
    `
    SELECT
      id_rubrica,
      id_periodo,
      ponderacion_global,
      nombre_rubrica,
      descripcion_rubrica,
      estado,
      created_at,
      updated_at
    FROM rubrica
    WHERE id_periodo = ?
      AND estado = 1
    LIMIT 1
    `,
    [id_periodo]
  );
  return rows[0] || null;
}

async function getById(id_rubrica) {
  const [rows] = await pool.query(
    `
    SELECT
      id_rubrica,
      id_periodo,
      ponderacion_global,
      nombre_rubrica,
      descripcion_rubrica,
      estado,
      created_at,
      updated_at
    FROM rubrica
    WHERE id_rubrica = ?
    LIMIT 1
    `,
    [id_rubrica]
  );
  return rows[0] || null;
}

/** ✅ Alias para compatibilidad con código viejo: rubricaRepo.findById(...) */
async function findById(id_rubrica) {
  return getById(id_rubrica);
}

async function create({ id_periodo, nombre_rubrica, descripcion_rubrica, ponderacion_global, estado }) {
  const [r] = await pool.query(
    `
    INSERT INTO rubrica
      (id_periodo, nombre_rubrica, descripcion_rubrica, ponderacion_global, estado)
    VALUES (?,?,?,?,?)
    `,
    [id_periodo, nombre_rubrica, descripcion_rubrica || null, ponderacion_global ?? 100, estado ?? 1]
  );
  return r.insertId;
}

async function update(id_rubrica, patch) {
  const fields = [];
  const values = [];

  if (patch.nombre_rubrica !== undefined) {
    fields.push("nombre_rubrica = ?");
    values.push(patch.nombre_rubrica);
  }
  if (patch.descripcion_rubrica !== undefined) {
    fields.push("descripcion_rubrica = ?");
    values.push(patch.descripcion_rubrica || null);
  }
  if (patch.ponderacion_global !== undefined) {
    fields.push("ponderacion_global = ?");
    values.push(patch.ponderacion_global);
  }

  if (!fields.length) return 0;

  values.push(id_rubrica);
  const [r] = await pool.query(
    `
    UPDATE rubrica
    SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id_rubrica = ?
    `,
    values
  );
  return r.affectedRows;
}

async function changeEstado(id_rubrica, estado01) {
  const [r] = await pool.query(
    `
    UPDATE rubrica
    SET estado = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id_rubrica = ?
    `,
    [estado01 ? 1 : 0, id_rubrica]
  );
  return r.affectedRows;
}

/* =========================================================
   ✅ COMPONENTES (según tu BD real)
   Tabla: rubrica_componente
   Campos reales (según tu front y tu data):
   - tipo_componente (ej: OTRO)
   - ponderacion (74.00, 40.00)
   - orden (1,2)
   ========================================================= */

async function listComponentes(id_rubrica, { includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `
    SELECT
      id_rubrica_componente,
      id_rubrica,
      nombre_componente,
      tipo_componente,
      ponderacion,
      orden,
      estado,
      created_at,
      updated_at
    FROM rubrica_componente
    WHERE id_rubrica = ?
      AND (? = TRUE OR estado = 1)
    ORDER BY orden ASC, id_rubrica_componente ASC
    `,
    [id_rubrica, includeInactive]
  );
  return rows;
}

module.exports = {
  list,
  getByPeriodo,
  getById,
  findById, // ✅ clave para que no reviente niveles
  create,
  update,
  changeEstado,
  listComponentes,
};
