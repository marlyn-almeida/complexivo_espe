// src/repositories/mis_calificaciones.repo.js
const pool = require("../config/db");

/**
 * ✅ ADMIN: tu función (NO la cambio)
 */
async function listByCP(id_carrera_periodo) {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_tribunal,
      t.nombre_tribunal,
      te.id_estudiante,

      e.nombres_estudiante,
      e.apellidos_estudiante,
      e.id_institucional_estudiante,

      eca.id_caso_estudio,

      ece.id_estudiante_caso_entrega,
      ece.archivo_nombre AS entrega_archivo_nombre,
      ece.archivo_path  AS entrega_archivo_path,
      ece.fecha_entrega AS entrega_fecha_entrega,
      ece.observacion   AS entrega_observacion,
      ece.estado        AS entrega_estado

    FROM tribunal t
    JOIN tribunal_estudiante te
      ON te.id_tribunal = t.id_tribunal
     AND te.estado = 1

    JOIN estudiante e
      ON e.id_estudiante = te.id_estudiante
     AND e.id_carrera_periodo = ?
     AND e.estado = 1

    LEFT JOIN estudiante_caso_asignacion eca
      ON eca.id_estudiante = e.id_estudiante
     AND eca.estado = 1

    LEFT JOIN estudiante_caso_entrega ece
      ON ece.id_estudiante = e.id_estudiante
     AND ece.id_caso_estudio = eca.id_caso_estudio
     AND ece.estado = 1

    WHERE t.id_carrera_periodo = ?
      AND t.estado = 1

    ORDER BY
      t.id_tribunal ASC,
      e.apellidos_estudiante ASC,
      e.nombres_estudiante ASC
    `,
    [id_carrera_periodo, id_carrera_periodo]
  );

  return rows;
}

/**
 * ✅ DOCENTE: valida que el docente pertenece al tribunal del tribunal_estudiante
 * Devuelve cabecera básica (estudiante/carrera/mi_rol/cerrado)
 */
async function getDocenteMembership(cp, idTribunalEstudiante, idUsuario) {
  const [rows] = await pool.query(
    `
    SELECT
      te.id_tribunal_estudiante,
      te.id_tribunal,
      COALESCE(te.cerrado, 0) AS cerrado,

      e.id_estudiante,
      CONCAT(e.nombres_estudiante,' ',e.apellidos_estudiante) AS estudiante,

      c.nombre_carrera AS carrera,

      td.rol_docente AS mi_rol
    FROM tribunal_estudiante te
    JOIN tribunal t
      ON t.id_tribunal = te.id_tribunal
     AND t.id_carrera_periodo = ?
     AND t.estado = 1

    JOIN estudiante e
      ON e.id_estudiante = te.id_estudiante
     AND e.estado = 1

    LEFT JOIN carrera c
      ON c.id_carrera = t.id_carrera

    JOIN tribunal_docente td
      ON td.id_tribunal = t.id_tribunal
     AND td.estado = 1

    JOIN docente d
      ON d.id_docente = td.id_docente
     AND d.id_usuario = ?

    WHERE te.id_tribunal_estudiante = ?
      AND te.estado = 1
    LIMIT 1
    `,
    [cp, idUsuario, idTribunalEstudiante]
  );

  return rows[0] || null;
}

/**
 * ✅ DOCENTE: GET /mis-calificaciones/:idTribunalEstudiante
 * Aquí debes devolver la estructura REAL ya filtrada por plan + rol.
 *
 * Por ahora:
 * - valida que el docente pertenece
 * - devuelve una respuesta que NO rompe el frontend (items vacíos)
 * Luego reemplazas items por tu query real del plan + rubrica.
 */
async function getForDocente(cp, idTribunalEstudiante, idUsuario) {
  const head = await getDocenteMembership(cp, idTribunalEstudiante, idUsuario);
  if (!head) {
    const err = new Error("Acceso denegado");
    err.status = 403;
    throw err;
  }

  // ✅ TODO: aquí tu lógica real (plan activo, items, componentes, criterios, niveles, existentes)
  // Este “shape” es el que tu CalificarTribunalPage espera.
  return {
    tribunal_estudiante: {
      id_tribunal_estudiante: head.id_tribunal_estudiante,
      estudiante: head.estudiante,
      carrera: head.carrera ?? null,
      cerrado: Number(head.cerrado ?? 0),
      mi_rol: head.mi_rol ?? "MIEMBRO",
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
 * Por ahora:
 * - valida pertenencia
 * - valida no cerrado
 * - deja “stub”
 *
 * Luego aquí conectas tu allowedMap + upsert en rubrica_criterio_calificacion.
 */
async function saveForDocente(cp, idTribunalEstudiante, idUsuario, payload) {
  const head = await getDocenteMembership(cp, idTribunalEstudiante, idUsuario);
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

  // ✅ TODO: reemplazar por tu lógica real
  // payload = { calificaciones: [{id_criterio,id_nivel,observacion}], observacion_general }
  // - construir allowedMap según plan + mi_rol
  // - upsert masivo en rubrica_criterio_calificacion
  // - guardar observacion_general si aplica

  return true;
}

module.exports = {
  listByCP,
  getForDocente,
  saveForDocente,
};
