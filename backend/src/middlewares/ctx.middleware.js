// ✅ src/middlewares/ctx.middleware.js
const pool = require("../config/db");

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

/** ✅ NUEVO: resolver id_docente usando id_usuario del token */
async function getDocenteIdByUsuarioId(id_usuario) {
  const [rows] = await pool.query(
    `SELECT id_docente
     FROM docente
     WHERE id_usuario = ?
     LIMIT 1`,
    [id_usuario]
  );
  return rows[0]?.id_docente ? Number(rows[0].id_docente) : null;
}

/** ✅ helper: toma CP de header/query/scope */
function pickRequestedCp(req) {
  // 1) header (tu axiosClient)
  const h1 = Number(req.headers["x-carrera-periodo-id"] || 0);
  if (h1 > 0) return h1;

  // (compat)
  const h2 = Number(req.headers["x-carrera-periodo"] || 0);
  if (h2 > 0) return h2;

  // 2) query (tu MisCalificacionesPage manda esto)
  const q1 = Number(req.query?.carreraPeriodoId || 0);
  if (q1 > 0) return q1;

  const q2 = Number(req.query?.id_carrera_periodo || 0);
  if (q2 > 0) return q2;

  // 3) scope (fallback)
  const s = Number(req.user?.scope?.id_carrera_periodo || 0);
  if (s > 0) return s;

  return null;
}

/**
 * ctx:
 * - Rol 2 (ADMIN): requiere CP válido y autorizado
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

    // ✅ IMPORTANTE: req.user.id es id_usuario, NO id_docente
    const id_usuario = Number(req.user?.id || 0);
    if (!id_usuario) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const id_docente = await getDocenteIdByUsuarioId(id_usuario);
    if (!id_docente) {
      return res.status(403).json({ message: "Perfil de docente no encontrado para este usuario" });
    }

    const requestedCpId = pickRequestedCp(req);
    if (!requestedCpId) {
      return res.status(403).json({ message: "Scope de carrera-período no disponible" });
    }

    // ✅ Validar que ese CP realmente te pertenece como DIRECTOR/APOYO
    const ok = await validateCpForRol2ByCpId(id_docente, requestedCpId);
    if (!ok) {
      return res.status(403).json({ message: "Carrera-Período no autorizado para tu perfil" });
    }

    req.ctx = { id_carrera_periodo: requestedCpId };
    req.carreraPeriodo = requestedCpId;   // compat
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
};
