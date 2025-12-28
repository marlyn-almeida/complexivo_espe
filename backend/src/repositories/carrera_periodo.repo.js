const pool = require("../config/db");

async function periodoExists(periodoId) {
  const [r] = await pool.query(
    `SELECT id_periodo FROM periodo_academico WHERE id_periodo=? LIMIT 1`,
    [periodoId]
  );
  return !!r.length;
}

async function carrerasExistAll(carreraIds = []) {
  if (!carreraIds.length) return { ok: false, missing: carreraIds };
  const ids = [...new Set(carreraIds.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0))];
  const [rows] = await pool.query(
    `SELECT id_carrera FROM carrera WHERE id_carrera IN (${ids.map(() => "?").join(",")})`,
    ids
  );
  const set = new Set(rows.map((r) => r.id_carrera));
  const missing = ids.filter((id) => !set.has(id));
  return { ok: missing.length === 0, missing };
}

/**
 * ✅ Tabla principal: lista períodos + conteos de carreras asignadas
 * - incluye periodos aunque no tengan asignaciones (LEFT JOIN)
 */
async function resumen({ q = "", includeInactive = false } = {}) {
  const where = [];
  const params = [];

  const term = String(q || "").trim().toLowerCase();
  if (term) {
    where.push(
      `(LOWER(pa.codigo_periodo) LIKE ? OR LOWER(COALESCE(pa.descripcion_periodo,'')) LIKE ?)`
    );
    const like = `%${term}%`;
    params.push(like, like);
  }

  // Si includeInactive=false, solo contamos asignaciones activas
  // pero igual listamos el periodo (con 0 si no hay)
  const cpJoin = includeInactive
    ? `LEFT JOIN carrera_periodo cp ON cp.id_periodo = pa.id_periodo`
    : `LEFT JOIN carrera_periodo cp ON cp.id_periodo = pa.id_periodo AND cp.estado = 1`;

  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `
    SELECT
      pa.id_periodo,
      pa.codigo_periodo,
      pa.descripcion_periodo,
      pa.fecha_inicio,
      pa.fecha_fin,
      COUNT(cp.id_carrera_periodo) AS total_asignadas
    FROM periodo_academico pa
    ${cpJoin}
    ${ws}
    GROUP BY pa.id_periodo
    ORDER BY pa.fecha_inicio DESC
    `,
    params
  );

  return rows;
}

/**
 * Lista de carreras asignadas a un periodo (para Ver / Editar)
 * includeInactive=true -> trae activas e inactivas
 * q filtra por carrera
 */
async function listByPeriodo({ periodoId, includeInactive = true, q = "" }) {
  const where = ["cp.id_periodo=?"];
  const params = [Number(periodoId)];

  if (!includeInactive) where.push("cp.estado=1");

  const term = String(q || "").trim().toLowerCase();
  if (term) {
    where.push(
      `(LOWER(c.nombre_carrera) LIKE ? OR LOWER(c.codigo_carrera) LIKE ? OR LOWER(COALESCE(c.sede,'')) LIKE ? OR LOWER(COALESCE(c.modalidad,'')) LIKE ?)`
    );
    const like = `%${term}%`;
    params.push(like, like, like, like);
  }

  const [rows] = await pool.query(
    `
    SELECT
      cp.id_carrera_periodo,
      cp.id_carrera,
      cp.id_periodo,
      cp.estado,
      cp.created_at,
      cp.updated_at,
      c.nombre_carrera,
      c.codigo_carrera,
      c.sede,
      c.modalidad,
      pa.codigo_periodo,
      pa.descripcion_periodo,
      pa.fecha_inicio,
      pa.fecha_fin
    FROM carrera_periodo cp
    JOIN carrera c ON c.id_carrera = cp.id_carrera
    JOIN periodo_academico pa ON pa.id_periodo = cp.id_periodo
    WHERE ${where.join(" AND ")}
    ORDER BY c.nombre_carrera ASC
    `,
    params
  );

  return rows;
}

/**
 * ✅ ASIGNAR (no quita nada): activa las seleccionadas + inserta las nuevas
 * - Si ya existían inactivas, las activa
 * - Si no existían, las inserta
 */
async function bulkAssign({ periodoId, carreraIds }) {
  const pid = Number(periodoId);
  if (!(await periodoExists(pid))) {
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }

  const ids = [...new Set((carreraIds || []).map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0))];
  if (!ids.length) {
    const e = new Error("carreraIds vacío o inválido");
    e.status = 422;
    throw e;
  }

  const chk = await carrerasExistAll(ids);
  if (!chk.ok) {
    const e = new Error(`Carreras no existen: ${chk.missing.join(", ")}`);
    e.status = 422;
    throw e;
  }

  await pool.query("START TRANSACTION");
  try {
    // 1) activa las que ya existían (aunque estén inactivas)
    await pool.query(
      `UPDATE carrera_periodo SET estado=1 WHERE id_periodo=? AND id_carrera IN (${ids.map(() => "?").join(",")})`,
      [pid, ...ids]
    );

    // 2) inserta las que no existían
    const values = ids.map(() => "(?,?,1)").join(",");
    const params = ids.flatMap((cid) => [cid, pid]);

    await pool.query(
      `INSERT IGNORE INTO carrera_periodo (id_carrera, id_periodo, estado) VALUES ${values}`,
      params
    );

    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }

  const items = await listByPeriodo({ periodoId: pid, includeInactive: true });
  return { updated: true, items };
}

/**
 * ✅ EDITAR (sync): deja EXACTAMENTE las seleccionadas activas y el resto inactivas
 * (no borra, solo cambia estado)
 */
async function syncPeriodo({ periodoId, carreraIds }) {
  const pid = Number(periodoId);
  if (!(await periodoExists(pid))) {
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }

  const ids = [...new Set((carreraIds || []).map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0))];

  // si mandas [], significa “dejar todas inactivas”
  if (ids.length) {
    const chk = await carrerasExistAll(ids);
    if (!chk.ok) {
      const e = new Error(`Carreras no existen: ${chk.missing.join(", ")}`);
      e.status = 422;
      throw e;
    }
  }

  await pool.query("START TRANSACTION");
  try {
    // 1) inactiva todas las relaciones del periodo
    await pool.query(`UPDATE carrera_periodo SET estado=0 WHERE id_periodo=?`, [pid]);

    if (ids.length) {
      // 2) activa las seleccionadas si existen
      await pool.query(
        `UPDATE carrera_periodo SET estado=1 WHERE id_periodo=? AND id_carrera IN (${ids.map(() => "?").join(",")})`,
        [pid, ...ids]
      );

      // 3) inserta las que no existían y deben quedar activas
      const values = ids.map(() => "(?,?,1)").join(",");
      const params = ids.flatMap((cid) => [cid, pid]);

      await pool.query(
        `INSERT IGNORE INTO carrera_periodo (id_carrera, id_periodo, estado) VALUES ${values}`,
        params
      );
    }

    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }

  const items = await listByPeriodo({ periodoId: pid, includeInactive: true });
  return { synced: true, items };
}

module.exports = {
  resumen,
  listByPeriodo,
  bulkAssign,
  syncPeriodo,
};
