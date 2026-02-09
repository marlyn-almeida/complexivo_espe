// plan_evaluacion.repo.js
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

  if (patch.nombre_plan !== undefined) {
    fields.push("nombre_plan=?");
    values.push(patch.nombre_plan);
  }
  if (patch.descripcion_plan !== undefined) {
    fields.push("descripcion_plan=?");
    values.push(patch.descripcion_plan || null);
  }
  if (patch.estado !== undefined) {
    fields.push("estado=?");
    values.push(patch.estado ? 1 : 0);
  }
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
    id_plan_evaluacion,
    nombre_item,
    tipo_item,
    ponderacion_global_pct,
    calificado_por,
    id_rubrica,
  } = data;

  const [r] = await pool.query(
    `
    INSERT INTO plan_evaluacion_item
      (id_plan_evaluacion, nombre_item, tipo_item, ponderacion_global_pct, calificado_por, id_rubrica)
    VALUES (?,?,?,?,?,?)
    `,
    [
      id_plan_evaluacion,
      nombre_item,
      tipo_item,
      ponderacion_global_pct,
      calificado_por,
      id_rubrica || null,
    ]
  );
  return r.insertId;
}

async function updateItem(id_plan_item, patch) {
  const allowed = [
    "nombre_item",
    "tipo_item",
    "ponderacion_global_pct",
    "calificado_por",
    "id_rubrica",
    "estado",
  ];
  const fields = [];
  const values = [];

  for (const k of allowed) {
    if (patch[k] !== undefined) {
      fields.push(`${k}=?`);
      const v = k === "estado" ? (patch[k] ? 1 : 0) : patch[k];
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

/**
 * ✅ setComponentCalificador (CORREGIDO)
 * Guarda calificado_por y opcionalmente designacion_tribunal
 *
 * Espera payload:
 * { id_plan_item, id_rubrica_componente, calificado_por, designacion_tribunal? }
 */
async function setComponentCalificador({
  id_plan_item,
  id_rubrica_componente,
  calificado_por,
  designacion_tribunal,
}) {
  // Si no mandan designacion_tribunal, usamos 'TODOS' por defecto
  const des = designacion_tribunal || "TODOS";

  const [r] = await pool.query(
    `
    INSERT INTO plan_item_rubrica_calificador
      (id_plan_item, id_rubrica_componente, calificado_por, designacion_tribunal)
    VALUES (?,?,?,?)
    ON DUPLICATE KEY UPDATE
      calificado_por = VALUES(calificado_por),
      designacion_tribunal = VALUES(designacion_tribunal),
      updated_at = CURRENT_TIMESTAMP,
      estado = 1
    `,
    [id_plan_item, id_rubrica_componente, calificado_por, des]
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

/**
 * ✅ NUEVO: obtener mi designación desde tribunal_estudiante (DOCENTE)
 * Seguridad: el docente debe pertenecer al tribunal del id_tribunal_estudiante y cp debe coincidir.
 */
async function getDocenteDesignacionFromTribunalEstudiante({ cp, id_tribunal_estudiante, id_docente }) {
  const [rows] = await pool.query(
    `
    SELECT
      td.designacion AS mi_designacion
    FROM tribunal_estudiante te
    JOIN tribunal t ON t.id_tribunal = te.id_tribunal
    JOIN tribunal_docente td ON td.id_tribunal = t.id_tribunal AND td.estado = 1
    JOIN carrera_docente cd ON cd.id_carrera_docente = td.id_carrera_docente AND cd.estado = 1
    WHERE te.id_tribunal_estudiante = ?
      AND te.estado = 1
      AND t.id_carrera_periodo = ?
      AND cd.id_docente = ?
    LIMIT 1
    `,
    [Number(id_tribunal_estudiante), Number(cp), Number(id_docente)]
  );

  return rows[0] || null;
}

/**
 * ✅ NUEVO: items del plan que califica el tribunal, filtrando componentes por designación.
 *
 * Devuelve items y, si el item es RUBRICA:
 * components = [{ id_rubrica_componente, nombre_componente, ... }]
 */
async function getItemsTribunalPorDesignacion({ id_plan_evaluacion, designacion }) {
  // 1) items TRIBUNAL
  const [items] = await pool.query(
    `
    SELECT
      id_plan_item,
      id_plan_evaluacion,
      nombre_item,
      tipo_item,
      ponderacion_global_pct,
      calificado_por,
      id_rubrica,
      estado
    FROM plan_evaluacion_item
    WHERE id_plan_evaluacion = ?
      AND estado = 1
      AND calificado_por = 'TRIBUNAL'
    ORDER BY id_plan_item ASC
    `,
    [Number(id_plan_evaluacion)]
  );

  if (!items.length) return [];

  // 2) componentes asignados por item, filtrados por mi designación
  // Nota: esto asume que rubrica_componente existe con id_rubrica_componente y nombre_componente.
  // Si tus columnas tienen otro nombre, me lo dices y lo ajusto.
  const [compRows] = await pool.query(
    `
    SELECT
      prc.id_plan_item,
      prc.id_rubrica_componente,
      prc.calificado_por,
      prc.designacion_tribunal,
      rc.nombre_componente
    FROM plan_item_rubrica_calificador prc
    JOIN rubrica_componente rc ON rc.id_rubrica_componente = prc.id_rubrica_componente
    WHERE prc.estado = 1
      AND prc.calificado_por = 'TRIBUNAL'
      AND prc.id_plan_item IN (${items.map(() => "?").join(",")})
      AND (prc.designacion_tribunal = 'TODOS' OR prc.designacion_tribunal = ?)
    ORDER BY prc.id_plan_item ASC, prc.id_rubrica_componente ASC
    `,
    [...items.map((i) => i.id_plan_item), String(designacion)]
  );

  const map = new Map();
  for (const r of compRows) {
    const key = Number(r.id_plan_item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({
      id_rubrica_componente: r.id_rubrica_componente,
      nombre_componente: r.nombre_componente,
      designacion_tribunal: r.designacion_tribunal,
    });
  }

  // 3) pegar componentes en cada item
  return items.map((it) => ({
    ...it,
    componentes: it.tipo_item === "RUBRICA" ? (map.get(Number(it.id_plan_item)) || []) : [],
  }));
}

module.exports = {
  getPlanByCP,
  createPlan,
  updatePlan,
  listItems,
  createItem,
  updateItem,
  setComponentCalificador,
  listComponentCalificadores,
  validatePlanInCP,

  // ✅ nuevos
  getDocenteDesignacionFromTribunalEstudiante,
  getItemsTribunalPorDesignacion,
};
