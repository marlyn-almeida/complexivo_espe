// ✅ backend/src/repositories/mis_calificaciones.repo.js
const pool = require("../config/db");

/**
 * ✅ ADMIN: lista por Carrera-Periodo (CP)
 *
 * REGLAS CORRECTAS (según tu backend actual):
 * - Listar estudiantes del CP aunque NO tengan tribunal
 * - Nota teórica SIEMPRE independiente del tribunal
 * - Entrega PDF depende de ESTUDIANTE (tabla estudiante_entrega)
 * - Solo se permite subir/ver entrega si el estudiante está asignado a un tribunal en ESTE CP
 * - Tribunal (si existe) es informativo
 */
async function listByCP(id_carrera_periodo) {
  const [rows] = await pool.query(
    `
    SELECT
      -- CP contexto
      cp.id_carrera_periodo,
      c.nombre_carrera,
      pa.codigo_periodo,

      -- estudiante (SIEMPRE)
      e.id_estudiante,
      e.id_institucional_estudiante,
      e.nombres_estudiante,
      e.apellidos_estudiante,

      -- ✅ nota teórica (independiente del tribunal)
      nt.id_nota_teorico,
      nt.nota_teorico_20,
      nt.observacion AS nota_teorico_observacion,
      nt.updated_at AS nota_teorico_updated_at,

      -- ✅ entrega por estudiante (tabla estudiante_entrega)
      ee.id_estudiante_entrega AS id_entrega,
      ee.archivo_nombre        AS entrega_archivo_nombre,
      ee.archivo_path          AS entrega_archivo_path,
      ee.fecha_entrega         AS entrega_fecha_entrega,
      ee.observacion           AS entrega_observacion,
      ee.estado                AS entrega_estado,

      -- ✅ tribunal (si existe) SOLO dentro del CP
      te.id_tribunal_estudiante,
      COALESCE(te.cerrado, 0) AS cerrado,
      te.id_tribunal,
      t.nombre_tribunal,
      fh.fecha AS fecha_tribunal,
      fh.hora_inicio,
      fh.hora_fin

    FROM carrera_periodo cp
    JOIN carrera c
      ON c.id_carrera = cp.id_carrera
    JOIN periodo_academico pa
      ON pa.id_periodo = cp.id_periodo

    -- ✅ Base: estudiantes del CP (NO dependemos de tribunal)
    JOIN estudiante e
      ON e.id_carrera_periodo = cp.id_carrera_periodo
     AND e.estado = 1

    -- ✅ nota teórica (0..1 por estudiante+cp)
    LEFT JOIN nota_teorico_estudiante nt
      ON nt.id_estudiante = e.id_estudiante
     AND nt.id_carrera_periodo = cp.id_carrera_periodo
     AND nt.estado = 1

    -- ✅ entrega (0..1 por estudiante)
    LEFT JOIN estudiante_entrega ee
      ON ee.id_estudiante = e.id_estudiante
     AND ee.estado = 1

    -- ✅ tribunal_estudiante MÁS RECIENTE del estudiante PERO SOLO dentro de ESTE CP
    LEFT JOIN tribunal_estudiante te
      ON te.id_tribunal_estudiante = (
        SELECT te2.id_tribunal_estudiante
        FROM tribunal_estudiante te2
        JOIN tribunal t2
          ON t2.id_tribunal = te2.id_tribunal
         AND t2.id_carrera_periodo = cp.id_carrera_periodo
         AND t2.estado = 1
        WHERE te2.id_estudiante = e.id_estudiante
          AND te2.estado = 1
        ORDER BY te2.id_tribunal_estudiante DESC
        LIMIT 1
      )

    LEFT JOIN tribunal t
      ON t.id_tribunal = te.id_tribunal
     AND t.id_carrera_periodo = cp.id_carrera_periodo
     AND t.estado = 1

    LEFT JOIN franja_horario fh
      ON fh.id_franja_horario = te.id_franja_horario
     AND fh.estado = 1

    WHERE cp.id_carrera_periodo = ?
      AND cp.estado = 1

    ORDER BY e.apellidos_estudiante ASC, e.nombres_estudiante ASC
    `,
    [Number(id_carrera_periodo)]
  );

  return rows;
}

/**
 * ✅ DOCENTE: valida que el docente pertenece al tribunal del tribunal_estudiante
 *
 * IMPORTANTE:
 * - NO dependemos de CP en header
 * - Derivamos CP desde el tribunal (t.id_carrera_periodo)
 * - Validamos pertenencia con tribunal_docente -> carrera_docente -> id_docente
 */
async function getDocenteMembership(idTribunalEstudiante, idDocente) {
  const [rows] = await pool.query(
    `
    SELECT
      te.id_tribunal_estudiante,
      te.id_tribunal,
      COALESCE(te.cerrado, 0) AS cerrado,

      t.id_carrera_periodo,
      t.nombre_tribunal,

      e.id_estudiante,
      CONCAT(e.nombres_estudiante,' ',e.apellidos_estudiante) AS estudiante,

      c.nombre_carrera AS carrera,
      pa.codigo_periodo,

      td.designacion AS mi_rol

    FROM tribunal_estudiante te
    JOIN tribunal t
      ON t.id_tribunal = te.id_tribunal
     AND t.estado = 1

    JOIN carrera_periodo cp
      ON cp.id_carrera_periodo = t.id_carrera_periodo

    JOIN carrera c
      ON c.id_carrera = cp.id_carrera

    JOIN periodo_academico pa
      ON pa.id_periodo = cp.id_periodo

    JOIN estudiante e
      ON e.id_estudiante = te.id_estudiante
     AND e.estado = 1

    JOIN tribunal_docente td
      ON td.id_tribunal = t.id_tribunal
     AND td.estado = 1

    JOIN carrera_docente cd
      ON cd.id_carrera_docente = td.id_carrera_docente
     AND cd.id_docente = ?
     AND cd.estado = 1

    WHERE te.id_tribunal_estudiante = ?
      AND te.estado = 1
    LIMIT 1
    `,
    [Number(idDocente), Number(idTribunalEstudiante)]
  );

  return rows[0] || null;
}

/**
 * ✅ DOCENTE: GET /mis-calificaciones/:idTribunalEstudiante
 * (AÚN STUB de plan/items, pero la validación ya es real)
 */
async function getForDocente(idTribunalEstudiante, idDocente) {
  const head = await getDocenteMembership(idTribunalEstudiante, idDocente);
  if (!head) {
    const err = new Error("Acceso denegado");
    err.status = 403;
    throw err;
  }

  return {
    tribunal_estudiante: {
      id_tribunal_estudiante: head.id_tribunal_estudiante,
      id_tribunal: head.id_tribunal,
      id_carrera_periodo: head.id_carrera_periodo,
      estudiante: head.estudiante,
      carrera: head.carrera ?? null,
      codigo_periodo: head.codigo_periodo ?? null,
      cerrado: Number(head.cerrado ?? 0),
      mi_rol: head.mi_rol ?? "MIEMBRO",
      nombre_tribunal: head.nombre_tribunal ?? null,
    },
    plan: {
      id_plan_evaluacion: 0,
      nombre_plan: "Plan activo (pendiente conectar query)",
    },
    items: [],
    observacion_general: "",
  };
}

/**
 * ✅ DOCENTE: POST /mis-calificaciones/:idTribunalEstudiante
 * (stub por ahora)
 */
async function saveForDocente(idTribunalEstudiante, idDocente, payload) {
  const head = await getDocenteMembership(idTribunalEstudiante, idDocente);
  if (!head) {
    const err = new Error("Acceso denegado");
    err.status = 403;
    throw err;
  }

  if (Number(head.cerrado ?? 0) === 1) {
    const err = new Error("Tribunal cerrado. No se puede guardar.");
    err.status = 409;
    throw err;
  }

  // TODO: implementar plan_evaluacion + items + persistencia
  return true;
}

module.exports = {
  listByCP,
  getForDocente,
  saveForDocente,
};
