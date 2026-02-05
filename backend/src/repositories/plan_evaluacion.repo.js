const pool = require("../config/db");

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

async function listItems(id_plan_evaluacion) {
  const [rows] = await pool.query(
    `SELECT * FROM plan_evaluacion_item WHERE id_plan_evaluacion = ? AND estado = 1 ORDER BY id_plan_item ASC`,
    [id_plan_evaluacion]
  );
  return rows;
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

// validar que el plan pertenece al CP (scope)
async function validatePlanInCP(id_plan_evaluacion, id_carrera_periodo) {
  const [rows] = await pool.query(
    `SELECT 1 FROM plan_evaluacion WHERE id_plan_evaluacion=? AND id_carrera_periodo=? LIMIT 1`,
    [id_plan_evaluacion, id_carrera_periodo]
  );
  return rows.length > 0;
}

module.exports = {
  getPlanByCP, createPlan, updatePlan,
  listItems, createItem, updateItem,
  setComponentCalificador, listComponentCalificadores,
  validatePlanInCP
};
