// src/middlewares/ctx.middleware.js
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
 * - req.user.scope viene de attachScope (rol 2)
 * - Para rol 1 no forzamos contexto
 */
async function attachCarreraPeriodoCtx(req, res, next) {
  try {
    const role = req.user?.activeRole ?? req.user?.rol ?? null;

    // ✅ rol 2 = "ADMIN"
    if (role !== "ADMIN") {
      req.ctx = { id_carrera_periodo: null };
      return next();
    }

    const scope = req.user?.scope;
    if (!scope?.id_carrera || !scope?.id_carrera_periodo) {
      return res.status(403).json({ message: "Scope de carrera-período no disponible" });
    }

    const id_docente = Number(req.user.id);
    const id_carrera = Number(scope.id_carrera);

    // Si el front manda el cpId seleccionado:
    const headerCp = req.headers["x-carrera-periodo-id"];
    const requestedCpId = headerCp ? Number(headerCp) : null;

    if (requestedCpId) {
      const ok = await validateCpForRol2(id_docente, id_carrera, requestedCpId);
      if (!ok) {
        return res.status(403).json({ message: "Carrera-Período no autorizado para tu perfil" });
      }
      req.ctx = { id_carrera_periodo: requestedCpId };
      return next();
    }

    // ✅ Si no mandó header → usar el que viene del scope (ya validado por autoridad)
    req.ctx = { id_carrera_periodo: Number(scope.id_carrera_periodo) };
    return next();
  } catch (e) {
    next(e);
  }
}

module.exports = { attachCarreraPeriodoCtx, getMisCarreraPeriodosPorDocente };
