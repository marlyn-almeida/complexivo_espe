// ✅ src/middlewares/ctx.middleware.js
const pool = require("../config/db");

async function getMisCarreraPeriodosPorDocente(id_docente) {
  const [rows] = await pool.query(
    `
    SELECT
      cp.id_carrera_periodo,
      cp.id_carrera,
      cp.id_periodo,
      cp.estado,
      c.nombre_carrera,
      pa.codigo_periodo,
      cpa.tipo_admin,
      cpa.estado AS estado_autoridad
    FROM carrera_periodo_autoridad cpa
    JOIN carrera_periodo cp ON cp.id_carrera_periodo = cpa.id_carrera_periodo
    JOIN carrera c ON c.id_carrera = cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo = cp.id_periodo
    WHERE cpa.id_docente = ?
      AND cpa.estado = 1
      AND cpa.tipo_admin IN ('DIRECTOR','APOYO')
    ORDER BY pa.codigo_periodo DESC, cp.id_carrera_periodo DESC
    `,
    [id_docente]
  );
  return rows;
}

// ✅ VALIDACIÓN por CP directamente
async function validateCpForRol2ByCpId(id_docente, id_carrera_periodo) {
  const [ok] = await pool.query(
    `
    SELECT 1
    FROM carrera_periodo_autoridad cpa
    JOIN carrera_periodo cp ON cp.id_carrera_periodo = cpa.id_carrera_periodo
    WHERE cpa.id_docente = ?
      AND cpa.estado = 1
      AND cpa.tipo_admin IN ('DIRECTOR','APOYO')
      AND cp.id_carrera_periodo = ?
    LIMIT 1
    `,
    [id_docente, id_carrera_periodo]
  );
  return ok.length > 0;
}

// (Compat si lo usas en otros lados)
async function validateCpForRol2(id_docente, id_carrera, id_carrera_periodo) {
  const [ok] = await pool.query(
    `
    SELECT 1
    FROM carrera_periodo_autoridad cpa
    JOIN carrera_periodo cp ON cp.id_carrera_periodo = cpa.id_carrera_periodo
    WHERE cpa.id_docente = ?
      AND cpa.estado = 1
      AND cpa.tipo_admin IN ('DIRECTOR','APOYO')
      AND cp.id_carrera = ?
      AND cp.id_carrera_periodo = ?
    LIMIT 1
    `,
    [id_docente, id_carrera, id_carrera_periodo]
  );
  return ok.length > 0;
}

/** ✅ helper: toma CP de header/query/scope */
function pickRequestedCp(req) {
  // 1) headers (axiosClient)
  const h1 = Number(req.headers["x-carrera-periodo-id"] || 0);
  if (h1 > 0) return h1;

  const h2 = Number(req.headers["x-carrera-periodo"] || 0);
  if (h2 > 0) return h2;

  const h3 = Number(req.headers["x-id-carrera-periodo"] || 0);
  if (h3 > 0) return h3;

  const h4 = Number(req.headers["x-cp-id"] || 0);
  if (h4 > 0) return h4;

  // 2) query params
  const q1 = Number(req.query?.carreraPeriodoId || 0);
  if (q1 > 0) return q1;

  const q2 = Number(req.query?.id_carrera_periodo || 0);
  if (q2 > 0) return q2;

  // 3) scope fallback (si tu auth lo pone)
  const s = Number(req.user?.scope?.id_carrera_periodo || 0);
  if (s > 0) return s;

  return null;
}

/**
 * ctx:
 * - Rol 2 (ADMIN): requiere CP válido y autorizado
 * - Otros roles: no forzamos ctx
 */
async function attachCarreraPeriodoCtx(req, res, next) {
  try {
    const role = req.user?.activeRole ?? req.user?.rol ?? null;

    // ✅ Solo ADMIN necesita ctx
    if (role !== "ADMIN") {
      req.ctx = { id_carrera_periodo: null };
      return next();
    }

    // ✅ Login basado en docente => JWT trae id_docente
    const id_docente = Number(req.user?.id || 0);
    if (!id_docente) {
      return res.status(401).json({ ok: false, message: "Token inválido (sin id_docente)" });
    }

    const requestedCpId = pickRequestedCp(req);
    if (!requestedCpId) {
      return res.status(400).json({ ok: false, message: "id_carrera_periodo requerido" });
    }

    const ok = await validateCpForRol2ByCpId(id_docente, requestedCpId);
    if (!ok) {
      return res.status(403).json({
        ok: false,
        message: "Carrera-Período no autorizado para tu perfil",
      });
    }

    req.ctx = { id_carrera_periodo: requestedCpId };
    req.carreraPeriodo = requestedCpId; // compat
    req.carreraPeriodoId = requestedCpId; // compat
    return next();
  } catch (e) {
    next(e);
  }
}

module.exports = {
  attachCarreraPeriodoCtx,
  getMisCarreraPeriodosPorDocente,
  validateCpForRol2,
  validateCpForRol2ByCpId,
  pickRequestedCp,
};
