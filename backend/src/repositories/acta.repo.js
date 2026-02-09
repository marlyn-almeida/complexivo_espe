// src/repositories/acta.repo.js
const pool = require("../config/db");

// ===============================
// CRUD ACTA
// ===============================
async function findByCalificacion(id_calificacion) {
  const [r] = await pool.query(`SELECT * FROM acta WHERE id_calificacion=? LIMIT 1`, [id_calificacion]);
  return r[0] || null;
}

async function findById(id) {
  const [r] = await pool.query(`SELECT * FROM acta WHERE id_acta=?`, [id]);
  return r[0] || null;
}

async function create(d) {
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
      d.estado_acta ?? "BORRADOR",
    ]
  );
  return findById(res.insertId);
}

async function updateById(id, d) {
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
      id,
    ]
  );
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.query(`UPDATE acta SET estado=? WHERE id_acta=?`, [estado ? 1 : 0, id]);
  return findById(id);
}

// ===============================
// ✅ CONSULTAS para generar acta
// ===============================
async function getConfigPonderacion(id_carrera_periodo) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM config_ponderacion_examen
    WHERE id_carrera_periodo = ? AND estado = 1
    LIMIT 1
    `,
    [Number(id_carrera_periodo)]
  );

  return (
    rows[0] || {
      peso_teorico_final_pct: 50,
      peso_practico_final_pct: 50,
      peso_practico_escrito_pct: 50,
      peso_practico_oral_pct: 50,
    }
  );
}

async function getNotaTeorico(id_carrera_periodo, id_estudiante) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM nota_teorico_estudiante
    WHERE id_carrera_periodo = ?
      AND id_estudiante = ?
      AND estado = 1
    LIMIT 1
    `,
    [Number(id_carrera_periodo), Number(id_estudiante)]
  );
  return rows[0] || null;
}

async function getContextTribunal(id_tribunal_estudiante) {
  const [rows] = await pool.query(
    `
    SELECT
      te.id_tribunal_estudiante,
      te.id_tribunal,
      te.id_estudiante,
      te.id_franja_horario,
      te.id_caso_estudio,

      e.id_institucional_estudiante,
      e.nombres_estudiante,
      e.apellidos_estudiante,

      t.id_carrera_periodo,

      c.nombre_carrera AS carrera_nombre,
      c.modalidad AS carrera_modalidad,

      fh.fecha AS fecha_examen

    FROM tribunal_estudiante te
    JOIN estudiante e ON e.id_estudiante = te.id_estudiante
    JOIN tribunal t ON t.id_tribunal = te.id_tribunal
    JOIN carrera_periodo cp ON cp.id_carrera_periodo = t.id_carrera_periodo
    JOIN carrera c ON c.id_carrera = cp.id_carrera
    JOIN franja_horario fh ON fh.id_franja_horario = te.id_franja_horario
    WHERE te.id_tribunal_estudiante = ?
    LIMIT 1
    `,
    [Number(id_tribunal_estudiante)]
  );

  return rows[0] || null;
}

async function getDocentesTribunal(id_tribunal) {
  const [rows] = await pool.query(
    `
    SELECT
      td.designacion,
      d.nombres_docente,
      d.apellidos_docente,
      d.cedula
    FROM tribunal_docente td
    JOIN carrera_docente cd ON cd.id_carrera_docente = td.id_carrera_docente
    JOIN docente d ON d.id_docente = cd.id_docente
    WHERE td.id_tribunal = ?
      AND td.estado = 1
      AND cd.estado = 1
    `,
    [Number(id_tribunal)]
  );

  const map = {
    PRESIDENTE: null,
    INTEGRANTE_1: null,
    INTEGRANTE_2: null,
  };

  for (const r of rows) {
    if (map[r.designacion] !== undefined) {
      map[r.designacion] = {
        nombre: `${r.nombres_docente} ${r.apellidos_docente}`.trim(),
        cedula: r.cedula,
      };
    }
  }

  return map;
}

async function getDirectorCP(id_carrera_periodo) {
  const [rows] = await pool.query(
    `
    SELECT
      d.nombres_docente,
      d.apellidos_docente,
      d.cedula
    FROM carrera_periodo_autoridad cpa
    JOIN docente d ON d.id_docente = cpa.id_docente
    WHERE cpa.id_carrera_periodo = ?
      AND cpa.tipo_admin = 'DIRECTOR'
      AND cpa.estado = 1
    LIMIT 1
    `,
    [Number(id_carrera_periodo)]
  );

  const r = rows[0];
  if (!r) return null;

  return {
    nombre: `${r.nombres_docente} ${r.apellidos_docente}`.trim(),
    cedula: r.cedula,
  };
}

async function getPlantillaActiva() {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM plantilla_acta_word
    WHERE estado = 1 AND estado_activa = 1
    ORDER BY id_plantilla DESC
    LIMIT 1
    `
  );
  return rows[0] || null;
}

module.exports = {
  // CRUD acta
  findByCalificacion,
  findById,
  create,
  updateById,
  setEstado,

  // helpers generación
  getConfigPonderacion,
  getNotaTeorico,
  getContextTribunal,
  getDocentesTribunal,
  getDirectorCP,
  getPlantillaActiva,
};
