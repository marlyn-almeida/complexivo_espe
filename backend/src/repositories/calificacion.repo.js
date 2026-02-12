// src/repositories/calificacion.repo.js
const pool = require("../config/db");

// =======================
// Lo existente (admin/global)
// =======================
async function getTribunalEstudianteBase(id_tribunal_estudiante) {
  const [r] = await pool.query(
    `
    SELECT
      te.id_tribunal_estudiante,
      t.id_carrera_periodo,
      cp.id_periodo
    FROM tribunal_estudiante te
    JOIN tribunal t ON t.id_tribunal = te.id_tribunal
    JOIN carrera_periodo cp ON cp.id_carrera_periodo = t.id_carrera_periodo
    WHERE te.id_tribunal_estudiante=? LIMIT 1
    `,
    [id_tribunal_estudiante]
  );
  return r[0] || null;
}

async function getRubrica(id_rubrica) {
  const [r] = await pool.query(
    `
    SELECT id_rubrica, id_periodo
    FROM rubrica
    WHERE id_rubrica=? LIMIT 1
    `,
    [id_rubrica]
  );
  return r[0] || null;
}

async function findAll({ includeInactive = false, tribunalEstudianteId = null, rubricaId = null } = {}) {
  const where = [];
  const params = [];
  if (!includeInactive) where.push("c.estado=1");
  if (tribunalEstudianteId) {
    where.push("c.id_tribunal_estudiante=?");
    params.push(+tribunalEstudianteId);
  }
  if (rubricaId) {
    where.push("c.id_rubrica=?");
    params.push(+rubricaId);
  }
  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `
    SELECT c.*
    FROM calificacion c
    ${ws}
    ORDER BY c.created_at DESC
    `,
    params
  );
  return rows;
}

async function findById(id) {
  const [r] = await pool.query(`SELECT * FROM calificacion WHERE id_calificacion=?`, [id]);
  return r[0] || null;
}

async function findOneByKey(id_tribunal_estudiante, id_rubrica, tipo_rubrica) {
  const [r] = await pool.query(
    `
    SELECT * FROM calificacion
    WHERE id_tribunal_estudiante=? AND id_rubrica=? AND tipo_rubrica=? LIMIT 1
    `,
    [id_tribunal_estudiante, id_rubrica, tipo_rubrica]
  );
  return r[0] || null;
}

async function create(d) {
  const [res] = await pool.query(
    `
    INSERT INTO calificacion
      (id_tribunal_estudiante, id_rubrica, tipo_rubrica, nota_base20, observacion, estado)
    VALUES (?,?,?,?,?,1)
    `,
    [d.id_tribunal_estudiante, d.id_rubrica, d.tipo_rubrica, d.nota_base20, d.observacion ?? null]
  );
  return findById(res.insertId);
}

async function update(id, d) {
  await pool.query(
    `
    UPDATE calificacion
    SET tipo_rubrica=?, nota_base20=?, observacion=?, updated_at=CURRENT_TIMESTAMP
    WHERE id_calificacion=?
    `,
    [d.tipo_rubrica, d.nota_base20, d.observacion ?? null, id]
  );
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(
    `UPDATE calificacion SET estado=?, updated_at=CURRENT_TIMESTAMP WHERE id_calificacion=?`,
    [estado ? 1 : 0, id]
  );
  return findById(id);
}

/**
 * ✅ Necesario para ACTA: crear/actualizar calificación FINAL por llave UNIQUE
 */
async function upsertByKey(d) {
  const existing = await findOneByKey(d.id_tribunal_estudiante, d.id_rubrica, d.tipo_rubrica);
  if (!existing) return create(d);
  return update(existing.id_calificacion, d);
}

// =======================
// ✅ NUEVO (DOCENTE) ajustado a TU BD
// =======================

async function getPlanActivoByCP(id_carrera_periodo) {
  const [rows] = await pool.query(
    `SELECT * FROM plan_evaluacion WHERE id_carrera_periodo=? AND estado=1 LIMIT 1`,
    [Number(id_carrera_periodo)]
  );
  return rows[0] || null;
}

/**
 * Contexto docente: confirma que el docente pertenece al tribunal del tribunal_estudiante
 * y trae designación + cerrado.
 */
async function getCtxDocenteTribunalEstudiante({ cp, id_tribunal_estudiante, id_docente }) {
  const [rows] = await pool.query(
    `
    SELECT
      td.designacion AS mi_designacion,
      te.cerrado
    FROM tribunal_estudiante te
    JOIN tribunal t ON t.id_tribunal = te.id_tribunal
    JOIN tribunal_docente td ON td.id_tribunal = t.id_tribunal AND td.estado=1
    JOIN carrera_docente cd ON cd.id_carrera_docente = td.id_carrera_docente AND cd.estado=1
    WHERE te.id_tribunal_estudiante = ?
      AND te.estado = 1
      AND ( ? = 0 OR t.id_carrera_periodo = ? )
      AND cd.id_docente = ?
    LIMIT 1
    `,
    [Number(id_tribunal_estudiante), Number(cp), Number(id_docente)]
  );

  return rows[0] || null;
}

/**
 * Estructura filtrada por plan + designación:
 * - items calificado_por = TRIBUNAL
 * - componentes asignados (plan_item_rubrica_calificador)
 * - criterios de esos componentes
 * - niveles (rubrica_nivel) del id_rubrica del item
 */
async function getEstructuraParaDocente({ id_plan_evaluacion, designacion }) {
  const [items] = await pool.query(
    `
    SELECT
      pei.id_plan_item,
      pei.nombre_item,
      pei.tipo_item,
      pei.ponderacion_global_pct,
      pei.calificado_por,
      pei.id_rubrica
    FROM plan_evaluacion_item pei
    WHERE pei.id_plan_evaluacion = ?
      AND pei.estado = 1
      AND pei.calificado_por = 'TRIBUNAL'
    ORDER BY pei.id_plan_item ASC
    `,
    [Number(id_plan_evaluacion)]
  );

  if (!items.length) return [];

  const itemIds = items.map((i) => Number(i.id_plan_item));

  const [rows] = await pool.query(
    `
    SELECT
      prc.id_plan_item,
      rc.id_rubrica_componente,
      rc.nombre_componente,
      rc.tipo_componente,
      rcr.id_rubrica_criterio,
      rcr.nombre_criterio
    FROM plan_item_rubrica_calificador prc
    JOIN rubrica_componente rc ON rc.id_rubrica_componente = prc.id_rubrica_componente AND rc.estado=1
    JOIN rubrica_criterio rcr ON rcr.id_rubrica_componente = rc.id_rubrica_componente AND rcr.estado=1
    WHERE prc.estado = 1
      AND prc.calificado_por = 'TRIBUNAL'
      AND prc.id_plan_item IN (${itemIds.map(() => "?").join(",")})
      AND (prc.designacion_tribunal = 'TODOS' OR prc.designacion_tribunal = ?)
    ORDER BY prc.id_plan_item ASC, rc.id_rubrica_componente ASC, rcr.id_rubrica_criterio ASC
    `,
    [...itemIds, String(designacion)]
  );

  // Niveles por rúbrica (por si front necesita mostrar opciones)
  const rubricaIds = Array.from(new Set(items.map((i) => Number(i.id_rubrica)).filter(Boolean)));
  let nivelesByRubrica = new Map();
  if (rubricaIds.length) {
    const [nivRows] = await pool.query(
      `
      SELECT id_rubrica, id_rubrica_nivel, nombre_nivel, valor_nivel, orden_nivel
      FROM rubrica_nivel
      WHERE id_rubrica IN (${rubricaIds.map(() => "?").join(",")})
        AND estado=1
      ORDER BY id_rubrica ASC, orden_nivel ASC
      `,
      rubricaIds
    );

    for (const n of nivRows) {
      const rid = Number(n.id_rubrica);
      if (!nivelesByRubrica.has(rid)) nivelesByRubrica.set(rid, []);
      nivelesByRubrica.get(rid).push({
        id_rubrica_nivel: Number(n.id_rubrica_nivel),
        nombre_nivel: n.nombre_nivel,
        valor_nivel: Number(n.valor_nivel),
        orden_nivel: Number(n.orden_nivel),
      });
    }
  }

  // armar mapa por item/componentes
  const byItem = new Map(); // id_plan_item => Map(compId => compObj)
  for (const it of items) byItem.set(Number(it.id_plan_item), new Map());

  for (const r of rows) {
    const itemMap = byItem.get(Number(r.id_plan_item));
    if (!itemMap) continue;

    const compId = Number(r.id_rubrica_componente);
    if (!itemMap.has(compId)) {
      itemMap.set(compId, {
        id_rubrica_componente: compId,
        nombre_componente: r.nombre_componente,
        tipo_componente: r.tipo_componente,
        criterios: [],
      });
    }
    itemMap.get(compId).criterios.push({
      id_rubrica_criterio: Number(r.id_rubrica_criterio),
      nombre_criterio: r.nombre_criterio,
    });
  }

  return items.map((it) => {
    const compsMap = byItem.get(Number(it.id_plan_item)) || new Map();
    const componentes = Array.from(compsMap.values());
    const niveles = it.id_rubrica ? (nivelesByRubrica.get(Number(it.id_rubrica)) || []) : [];
    return { ...it, componentes, niveles };
  });
}

/**
 * Seguridad: set permitido de (item, componente, criterio) que el docente puede calificar.
 */
async function getAllowedMap({ id_plan_evaluacion, designacion }) {
  const [rows] = await pool.query(
    `
    SELECT
      pei.id_plan_item,
      rc.id_rubrica_componente,
      rcr.id_rubrica_criterio
    FROM plan_evaluacion_item pei
    JOIN plan_item_rubrica_calificador prc ON prc.id_plan_item = pei.id_plan_item AND prc.estado=1
    JOIN rubrica_componente rc ON rc.id_rubrica_componente = prc.id_rubrica_componente AND rc.estado=1
    JOIN rubrica_criterio rcr ON rcr.id_rubrica_componente = rc.id_rubrica_componente AND rcr.estado=1
    WHERE pei.id_plan_evaluacion = ?
      AND pei.estado = 1
      AND pei.calificado_por = 'TRIBUNAL'
      AND prc.calificado_por = 'TRIBUNAL'
      AND (prc.designacion_tribunal = 'TODOS' OR prc.designacion_tribunal = ?)
    `,
    [Number(id_plan_evaluacion), String(designacion)]
  );

  const set = new Set();
  for (const r of rows) {
    set.add(`${Number(r.id_plan_item)}:${Number(r.id_rubrica_componente)}:${Number(r.id_rubrica_criterio)}`);
  }
  return set;
}

/**
 * Calificaciones existentes del docente por criterio (TU BD):
 * tabla rubrica_criterio_calificacion usa id_docente_califica + id_rubrica_nivel + puntaje
 */
async function getCalificacionesDocente({ id_tribunal_estudiante, id_docente_califica }) {
  const [rows] = await pool.query(
    `
    SELECT
      rcc.id_plan_item,
      rcc.id_rubrica_componente,
      rcc.id_rubrica_criterio,
      rcc.id_rubrica_nivel,
      rcc.puntaje,
      rcc.observacion,
      rcc.updated_at,
      rcc.created_at
    FROM rubrica_criterio_calificacion rcc
    WHERE rcc.id_tribunal_estudiante = ?
      AND rcc.id_docente_califica = ?
      AND rcc.estado = 1
    `,
    [Number(id_tribunal_estudiante), Number(id_docente_califica)]
  );
  return rows;
}

/**
 * Upsert masivo por criterio (TU BD):
 * UNIQUE uq_rcc = (id_tribunal_estudiante, id_plan_item, id_rubrica_criterio, id_docente_califica)
 * puntaje = valor_nivel (rubrica_nivel.valor_nivel)
 */
async function upsertCriteriosCalificacion(rows) {
  if (!rows.length) return 0;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const r of rows) {
      // obtener valor_nivel para guardarlo como puntaje
      const [niv] = await conn.query(
        `SELECT valor_nivel FROM rubrica_nivel WHERE id_rubrica_nivel=? LIMIT 1`,
        [Number(r.id_rubrica_nivel)]
      );
      if (!niv?.[0]) {
        const e = new Error("Nivel inválido (id_rubrica_nivel no existe)");
        e.status = 422;
        throw e;
      }
      const puntaje = Number(niv[0].valor_nivel);

      await conn.query(
        `
        INSERT INTO rubrica_criterio_calificacion
          (id_tribunal_estudiante, id_plan_item, id_rubrica_componente, id_rubrica_criterio,
           id_rubrica_nivel, puntaje, observacion, id_docente_califica, estado)
        VALUES (?,?,?,?,?,?,?,?,1)
        ON DUPLICATE KEY UPDATE
          id_rubrica_componente = VALUES(id_rubrica_componente),
          id_rubrica_nivel = VALUES(id_rubrica_nivel),
          puntaje = VALUES(puntaje),
          observacion = VALUES(observacion),
          estado = 1,
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          Number(r.id_tribunal_estudiante),
          Number(r.id_plan_item),
          Number(r.id_rubrica_componente),
          Number(r.id_rubrica_criterio),
          Number(r.id_rubrica_nivel),
          puntaje,
          r.observacion ?? null,
          Number(r.id_docente_califica),
        ]
      );
    }

    await conn.commit();
    return rows.length;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  // admin/global
  getTribunalEstudianteBase,
  getRubrica,
  findAll,
  findById,
  findOneByKey,
  create,
  update,
  setEstado,
  upsertByKey,

  // docente
  getPlanActivoByCP,
  getCtxDocenteTribunalEstudiante,
  getEstructuraParaDocente,
  getAllowedMap,
  getCalificacionesDocente,
  upsertCriteriosCalificacion,
};
