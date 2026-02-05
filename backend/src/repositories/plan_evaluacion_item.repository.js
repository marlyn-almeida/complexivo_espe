// src/repositories/plan_evaluacion_item.repository.js
const pool = require("../config/db");

/* =========================
   PLAN
   ========================= */

async function getPlanByCP(id_carrera_periodo) {
  const [rows] = await pool.query(
    `SELECT * FROM plan_evaluacion WHERE id_carrera_periodo = ? AND estado = 1 LIMIT 1`,
    [id_carrera_periodo]
  );
  return rows[0] || null;
}

async function createPlan({ id_carrera_periodo, nombre_plan, descripcion_plan }) {
  const [r] = await pool.query(
    `INSERT INTO plan_evaluacion (id_carrera_periodo, nombre_plan, descripcion_plan) VALUES (?,?,?)`,
    [id_carrera_periodo, nombre_plan, descripcion_plan || null]
  );
  return r.insertId;
}

async function updatePlan(id_plan_evaluacion, patch) {
  const fields = [];
  const values = [];

  if (patch.nombre_plan !== undefined) { fields.push("nombre_plan=?"); values.push(patch.nombre_plan); }
  if (patch.descripcion_plan !== undefined) { fields.push("descripcion_plan=?"); values.push(patch.descripcion_plan || null); }
  if (patch.estado !== undefined) { fields.push("estado=?"); values.push(patch.estado ? 1 : 0); }
  if (!fields.length) return 0;

  values.push(id_plan_evaluacion);
  const [r] = await pool.query(
    `UPDATE plan_evaluacion SET ${fields.join(", ")}, updated_at=CURRENT_TIMESTAMP WHERE id_plan_evaluacion=?`,
    values
  );
  return r.affectedRows;
}

async function validatePlanInCP(id_plan_evaluacion, id_carrera_periodo) {
  const [rows] = await pool.query(
    `SELECT 1 FROM plan_evaluacion WHERE id_plan_evaluacion=? AND id_carrera_periodo=? LIMIT 1`,
    [id_plan_evaluacion, id_carrera_periodo]
  );
  return rows.length > 0;
}

/* =========================
   ÍTEMS
   ========================= */

async function listItems(id_plan_evaluacion) {
  const [rows] = await pool.query(
    `SELECT * FROM plan_evaluacion_item WHERE id_plan_evaluacion = ? AND estado = 1 ORDER BY id_plan_item ASC`,
    [id_plan_evaluacion]
  );
  return rows;
}

async function getItemById(id_plan_item) {
  const [rows] = await pool.query(
    `SELECT * FROM plan_evaluacion_item WHERE id_plan_item=? LIMIT 1`,
    [id_plan_item]
  );
  return rows[0] || null;
}

async function createItem(data) {
  const {
    id_plan_evaluacion, nombre_item, tipo_item,
    ponderacion_global_pct, calificado_por,
    id_rubrica
  } = data;

  const [r] = await pool.query(
    `
    INSERT INTO plan_evaluacion_item
      (id_plan_evaluacion, nombre_item, tipo_item, ponderacion_global_pct, calificado_por, id_rubrica)
    VALUES (?,?,?,?,?,?)
    `,
    [id_plan_evaluacion, nombre_item, tipo_item, ponderacion_global_pct, calificado_por, id_rubrica || null]
  );
  return r.insertId;
}

async function updateItem(id_plan_item, patch) {
  const allowed = ["nombre_item", "tipo_item", "ponderacion_global_pct", "calificado_por", "id_rubrica", "estado"];
  const fields = [];
  const values = [];

  for (const k of allowed) {
    if (patch[k] !== undefined) {
      fields.push(`${k}=?`);
      const v = (k === "estado") ? (patch[k] ? 1 : 0) : patch[k];
      values.push(v);
    }
  }
  if (!fields.length) return 0;

  values.push(id_plan_item);
  const [r] = await pool.query(
    `UPDATE plan_evaluacion_item SET ${fields.join(", ")}, updated_at=CURRENT_TIMESTAMP WHERE id_plan_item=?`,
    values
  );
  return r.affectedRows;
}

/* =========================
   Validaciones rúbrica vs CP
   ========================= */

// Verifica que la rúbrica corresponda al período del CP (CP -> periodo_academico)
async function validateRubricaMatchesCP(id_carrera_periodo, id_rubrica) {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM carrera_periodo cp
    JOIN rubrica r ON r.id_periodo = cp.id_periodo
    WHERE cp.id_carrera_periodo = ?
      AND r.id_rubrica = ?
      AND cp.estado = 1
      AND r.estado = 1
    LIMIT 1
    `,
    [id_carrera_periodo, id_rubrica]
  );
  return rows.length > 0;
}

async function validateComponenteInRubrica(id_rubrica_componente, id_rubrica) {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM rubrica_componente rc
    WHERE rc.id_rubrica_componente = ?
      AND rc.id_rubrica = ?
      AND rc.estado = 1
    LIMIT 1
    `,
    [id_rubrica_componente, id_rubrica]
  );
  return rows.length > 0;
}

/* =========================
   RÚBRICA: calificador por componente
   ========================= */

async function setComponentCalificador({ id_plan_item, id_rubrica_componente, calificado_por }) {
  const [r] = await pool.query(
    `
    INSERT INTO plan_item_rubrica_calificador
      (id_plan_item, id_rubrica_componente, calificado_por)
    VALUES (?,?,?)
    ON DUPLICATE KEY UPDATE
      calificado_por = VALUES(calificado_por),
      updated_at = CURRENT_TIMESTAMP,
      estado = 1
    `,
    [id_plan_item, id_rubrica_componente, calificado_por]
  );
  return r.affectedRows;
}

async function listComponentCalificadores(id_plan_item) {
  const [rows] = await pool.query(
    `SELECT * FROM plan_item_rubrica_calificador WHERE id_plan_item = ? AND estado = 1`,
    [id_plan_item]
  );
  return rows;
}

/* =========================
   ✅ NUEVO: Calificadores Generales por ítem NO rúbrica
   ========================= */

// Valida que ese id_cp_calificador_general pertenezca al CP, esté activo y sea DOCENTE rol 3
async function validateCpCalificadorGeneralInCP({ id_carrera_periodo, id_cp_calificador_general }) {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM carrera_periodo_calificador_general cpcg
    JOIN carrera_docente cd ON cd.id_carrera_docente = cpcg.id_carrera_docente
    JOIN rol_docente rd ON rd.id_docente = cd.id_docente AND rd.id_rol = 3 AND rd.estado = 1
    WHERE cpcg.id_cp_calificador_general = ?
      AND cpcg.id_carrera_periodo = ?
      AND cpcg.estado = 1
      AND cd.estado = 1
      AND cd.tipo_admin = 'DOCENTE'
    LIMIT 1
    `,
    [id_cp_calificador_general, id_carrera_periodo]
  );
  return rows.length > 0;
}

async function listItemCalificadoresGenerales(id_plan_item) {
  const [rows] = await pool.query(
    `
    SELECT
      picg.id_plan_item_calificador_general,
      picg.id_plan_item,
      picg.id_cp_calificador_general,
      cpcg.id_carrera_periodo,
      cd.id_carrera_docente,
      d.id_docente,
      d.nombres_docente,
      d.apellidos_docente,
      d.correo_docente,
      picg.estado,
      picg.created_at,
      picg.updated_at
    FROM plan_item_calificador_general picg
    JOIN carrera_periodo_calificador_general cpcg
      ON cpcg.id_cp_calificador_general = picg.id_cp_calificador_general
    JOIN carrera_docente cd
      ON cd.id_carrera_docente = cpcg.id_carrera_docente
    JOIN docente d
      ON d.id_docente = cd.id_docente
    WHERE picg.id_plan_item = ?
      AND picg.estado = 1
      AND cpcg.estado = 1
      AND cd.estado = 1
      AND d.estado = 1
    ORDER BY d.apellidos_docente ASC, d.nombres_docente ASC
    `,
    [id_plan_item]
  );
  return rows;
}

async function replaceItemCalificadoresGenerales(id_plan_item, ids_cp_calificador_general) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Borrado lógico (para mantener historial si quieres)
    await conn.query(
      `UPDATE plan_item_calificador_general
       SET estado = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id_plan_item = ?`,
      [id_plan_item]
    );

    // Insertar nuevos
    for (const id_cg of ids_cp_calificador_general) {
      await conn.query(
        `
        INSERT INTO plan_item_calificador_general (id_plan_item, id_cp_calificador_general, estado)
        VALUES (?,?,1)
        ON DUPLICATE KEY UPDATE
          estado = 1,
          updated_at = CURRENT_TIMESTAMP
        `,
        [id_plan_item, id_cg]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  // Plan
  getPlanByCP,
  createPlan,
  updatePlan,
  validatePlanInCP,

  // Items
  listItems,
  getItemById,
  createItem,
  updateItem,

  // Validaciones rúbrica
  validateRubricaMatchesCP,
  validateComponenteInRubrica,

  // Calificador por componente
  setComponentCalificador,
  listComponentCalificadores,

  // ✅ Calificadores generales por item
  validateCpCalificadorGeneralInCP,
  listItemCalificadoresGenerales,
  replaceItemCalificadoresGenerales,
};
