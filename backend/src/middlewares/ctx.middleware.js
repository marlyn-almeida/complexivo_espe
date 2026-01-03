const pool = require("../config/db");

async function getMisCarreraPeriodos(id_carrera) {
  const [rows] = await pool.query(
    `SELECT cp.id_carrera_periodo, cp.id_carrera, cp.id_periodo, cp.estado,
            c.nombre_carrera, pa.codigo_periodo
     FROM carrera_periodo cp
     JOIN carrera c ON c.id_carrera = cp.id_carrera
     JOIN periodo_academico pa ON pa.id_periodo = cp.id_periodo
     WHERE cp.id_carrera = ?
     ORDER BY pa.codigo_periodo DESC, cp.id_carrera_periodo DESC`,
    [id_carrera]
  );
  return rows;
}

async function getCarreraPeriodoActivo(id_carrera) {
  const [rows] = await pool.query(
    `SELECT cp.id_carrera_periodo
     FROM carrera_periodo cp
     WHERE cp.id_carrera = ?
       AND cp.estado = 1
     ORDER BY cp.id_carrera_periodo DESC
     LIMIT 1`,
    [id_carrera]
  );
  return rows[0]?.id_carrera_periodo ?? null;
}

/**
 * ctx:
 * - req.user.scope.id_carrera viene de tu attachScope (rol 2)
 * - Para rol 1 (super admin) puedes dejarlo nulo o usar query normal
 */
async function attachCarreraPeriodoCtx(req, res, next) {
  try {
    const activeRole = req.user?.activeRole ?? req.user?.rol ?? null;

    // Solo aplicamos contexto automático para Rol 2
    if (Number(activeRole) !== 2) {
      req.ctx = { id_carrera_periodo: null };
      return next();
    }

    const scope = req.user?.scope;
    if (!scope?.id_carrera) {
      return res.status(403).json({ message: "Scope de carrera no disponible" });
    }

    const id_carrera = Number(scope.id_carrera);

    // Si el front manda el cpId seleccionado:
    const headerCp = req.headers["x-carrera-periodo-id"];
    const requestedCpId = headerCp ? Number(headerCp) : null;

    if (requestedCpId) {
      // Validar que ese cp pertenece a su carrera
      const [ok] = await pool.query(
        `SELECT 1
         FROM carrera_periodo
         WHERE id_carrera_periodo = ?
           AND id_carrera = ?
         LIMIT 1`,
        [requestedCpId, id_carrera]
      );
      if (!ok.length) {
        return res.status(403).json({ message: "Carrera-Período no pertenece a tu carrera" });
      }
      req.ctx = { id_carrera_periodo: requestedCpId };
      return next();
    }

    // Si no mandó header → usar el activo por defecto
    const activeCpId = await getCarreraPeriodoActivo(id_carrera);

    if (!activeCpId) {
      // Si no hay activo, devolvemos además los que sí tiene (para debug/UI)
      const mis = await getMisCarreraPeriodos(id_carrera);
      return res.status(409).json({
        message: "No tienes un Carrera-Período ACTIVO asignado para trabajar",
        carreraPeriodosDisponibles: mis,
      });
    }

    req.ctx = { id_carrera_periodo: activeCpId };
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { attachCarreraPeriodoCtx };
