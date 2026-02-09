// ✅ src/repositories/mis_calificaciones.repo.js
const pool = require("../config/db");

/**
 * ✅ ADMIN: tu función (MISMA IDEA)
 * Solo agregamos campos que el FRONT necesita:
 * - te.id_tribunal_estudiante  (para habilitar SUBIR)
 * - franja_horaria (fecha/hora) para que no salga "—"
 * - estado/cerrado (opcional)
 */
async function listByCP(id_carrera_periodo) {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_tribunal,
      t.nombre_tribunal,
      t.estado AS estado_tribunal,

      te.id_tribunal_estudiante,       -- ✅ CLAVE
      te.id_estudiante,
      COALESCE(te.cerrado, 0) AS cerrado,

      fh.fecha AS fecha_tribunal,      -- ✅ para tu tabla (si existe franja)
      fh.hora_inicio,
      fh.hora_fin,

      e.nombres_estudiante,
      e.apellidos_estudiante,
      e.id_institucional_estudiante,

      eca.id_caso_estudio,

      ece.id_estudiante_caso_entrega AS id_entrega,
      ece.archivo_nombre AS entrega_archivo_nombre,
      ece.archivo_path  AS entrega_archivo_path,
      ece.fecha_entrega AS entrega_fecha_entrega,
      ece.observacion   AS entrega_observacion,
      ece.estado        AS entrega_estado

    FROM tribunal t
    JOIN tribunal_estudiante te
      ON te.id_tribunal = t.id_tribunal
     AND te.estado = 1

    LEFT JOIN franja_horaria fh
      ON fh.id_franja_horaria = te.id_franja_horaria
     AND fh.estado = 1

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
 * (stub por ahora)
 */
async function getForDocente(cp, idTribunalEstudiante, idUsuario) {
  const head = await getDocenteMembership(cp, idTribunalEstudiante, idUsuario);
  if (!head) {
    const err = new Error("Acceso denegado");
    err.status = 403;
    throw err;
  }

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
 * (stub por ahora)
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

  return true;
}

module.exports = {
  listByCP,
  getForDocente,
  saveForDocente,
};
