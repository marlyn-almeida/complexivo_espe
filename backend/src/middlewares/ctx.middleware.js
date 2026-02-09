// src/middlewares/ctx.middleware.js
const pool = require("../config/db");

/** ✅ convertir id_usuario (JWT) -> id_docente */
async function getDocenteIdByUserId(id_usuario) {
  const [rows] = await pool.query(
    `SELECT id_docente FROM docente WHERE id_usuario = ? LIMIT 1`,
    [id_usuario]
  );
  return rows[0]?.id_docente ?? null;
}

async function getMisCarreraPeriodosPorDocente(id_docente) {
  const [rows] = await pool.query(
    `SELECT cp.id_carrera_periodo, cp.id_carrera, cp.id_periodo, cp.estado,
            c.nombre_carrera, pa.codigo_periodo,
            cpa.tipo_admin, cpa.estado AS estado_autoridad
     FROM carrera_periodo_autoridad cpa
     JOIN carrera_periodo cp ON cp.id_carrera_periodo = cpa.id_carrera_periodo
     JOIN carrera c ON c.id_carrera = cp.id_carrera
     JOIN periodo_academico pa ON pa.id_periodo = cp.id_periodo
     WHERE cpa.id_docente = ?
       AND cpa.estado = 1
       AND cpa.tipo_admin IN ('DIRECTOR','APOYO')
     ORDER BY pa.codigo_periodo DESC, cp.id_carrera_periodo DESC`,
    [id_docente]
  );
  return rows;
}

// ✅ VALIDACIÓN por CP directamente (SIN depender de scope.id_carrera)
async function validateCpForRol2ByCpId(id_docente, id_carrera_periodo) {
  const [ok] = await pool.query(
    `SELECT 1
     FROM carrera_periodo_autoridad cpa
     JOIN carrera_periodo cp ON cp.id_carrera_periodo = cpa.id_carrera_periodo
     WHERE cpa.id_docente = ?
       AND cpa.estado = 1
       AND cpa.tipo_admin IN ('DIRECTOR','APOYO')
       AND cp.id_carrera_periodo = ?
     LIMIT 1`,
    [id_docente, id_carrera_periodo]
  );
  return ok.length > 0;
}

// (Mantengo esta por si aún la usas en otros lados)
async function validateCpForRol2(id_docente, id_carrera, id_carrera_periodo) {
  const [ok] = await pool.query(
    `SELECT 1
     FROM carrera_periodo_autoridad cpa
     JOIN carrera_periodo cp ON cp.id_carrera_periodo = cpa.id_carrera_periodo
     WHERE cpa.id_docente = ?
       AND cpa.estado = 1
       AND cpa.tipo_admin IN ('DIRECTOR','APOYO')
       AND cp.id_carrera = ?
       AND cp.id_carrera_periodo = ?
     LIMIT 1`,
    [id_docente, id_carrera, id_carrera_periodo]
  );
  return ok.length > 0;
}

/**
 * ctx:
 * - Rol 2 (ADMIN): requiere CP válido
 * - Rol 1/3: no forzamos ctx aquí (queda null)
 */
async function attachCarreraPeriodoCtx(req, res, next) {
  try {
    const role = req.user?.activeRole ?? req.user?.rol ?? null;

    // ✅ Solo ADMIN necesita ctx para estos módulos
    if (role !== "ADMIN") {
      req.ctx = { id_carrera_periodo: null };
      return next();
    }

    // ✅ req.user.id es id_usuario (del JWT). Convertimos a id_docente real.
    const id_usuario = Number(req.user?.id || 0);
    const id_docente = await getDocenteIdByUserId(id_usuario);

    if (!id_docente) {
      return res.status(403).json({
        message: "Docente no encontrado para el usuario autenticado",
      });
    }

    // ✅ 1) PRIORIDAD: header CP (lo manda tu axiosClient si existe en localStorage)
    const headerCp = req.headers["x-carrera-periodo-id"];
    const requestedCpId = headerCp ? Number(headerCp) : null;

    if (requestedCpId && Number.isFinite(requestedCpId) && requestedCpId > 0) {
      const ok = await validateCpForRol2ByCpId(id_docente, requestedCpId);
      if (!ok) {
        return res
          .status(403)
          .json({ message: "Carrera-Período no autorizado para tu perfil" });
      }
      req.ctx = { id_carrera_periodo: requestedCpId };
      return next();
    }

    // ✅ 2) Fallback: usar scope si existe (por si no envían header)
    const scope = req.user?.scope;
    if (!scope?.id_carrera_periodo) {
      return res
        .status(403)
        .json({ message: "Scope de carrera-período no disponible" });
    }

    req.ctx = { id_carrera_periodo: Number(scope.id_carrera_periodo) };
    return next();
  } catch (e) {
    next(e);
  }
}

module.exports = {
  attachCarreraPeriodoCtx,
  getMisCarreraPeriodosPorDocente,
  validateCpForRol2,
  validateCpForRol2ByCpId, // opcional, por si lo quieres usar fuera
  getDocenteIdByUserId,    // opcional, útil para depurar
};
