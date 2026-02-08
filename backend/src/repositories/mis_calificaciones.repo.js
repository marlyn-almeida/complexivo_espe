// ✅ src/repositories/mis_calificaciones.repo.js
const pool = require("../config/db");

/**
 * Devuelve estudiantes que ya están asignados a tribunales (te.estado=1)
 * dentro del CP del contexto (t.id_carrera_periodo = cp).
 *
 * Incluye:
 * - tribunal
 * - estudiante
 * - caso asignado (eca activo)
 * - entrega activa (ece activo) si existe
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

module.exports = { listByCP };
