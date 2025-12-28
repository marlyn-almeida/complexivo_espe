const pool = require("../config/db");

// ---- Helpers de integridad ----
async function carreraExists(carreraId) {
  const [r] = await pool.query(
    `SELECT id_carrera FROM carrera WHERE id_carrera=? LIMIT 1`,
    [carreraId]
  );
  return !!r.length;
}

async function periodoExists(periodoId) {
  const [r] = await pool.query(
    `SELECT id_periodo FROM periodo_academico WHERE id_periodo=? LIMIT 1`,
    [periodoId]
  );
  return !!r.length;
}

// ---- Repo principal ----
async function exists(carreraId, periodoId, excludeId = null) {
  const where = ["id_carrera=? AND id_periodo=?"];
  const params = [carreraId, periodoId];

  if (excludeId != null) {
    where.push("id_carrera_periodo<>?");
    params.push(excludeId);
  }

  const [r] = await pool.query(
    `SELECT id_carrera_periodo FROM carrera_periodo WHERE ${where.join(" AND ")} LIMIT 1`,
    params
  );
  return r[0] || null;
}

async function list({
  carreraId = null,
  periodoId = null,
  includeInactive = false,
  q = "",
} = {}) {
  const where = [];
  const p = [];

  if (!includeInactive) where.push("cp.estado=1");

  if (carreraId) {
    where.push("cp.id_carrera=?");
    p.push(+carreraId);
  }

  if (periodoId) {
    where.push("cp.id_periodo=?");
    p.push(+periodoId);
  }

  const query = String(q || "").trim();
  if (query) {
    where.push(
      `(LOWER(c.nombre_carrera) LIKE ? OR LOWER(c.codigo_carrera) LIKE ? OR LOWER(pa.codigo_periodo) LIKE ?)`
    );
    const like = `%${query.toLowerCase()}%`;
    p.push(like, like, like);
  }

  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [r] = await pool.query(
    `SELECT
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
     JOIN carrera c ON c.id_carrera=cp.id_carrera
     JOIN periodo_academico pa ON pa.id_periodo=cp.id_periodo
     ${ws}
     ORDER BY cp.created_at DESC`,
    p
  );

  return r;
}

async function findById(id) {
  const [r] = await pool.query(
    `SELECT
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
     JOIN carrera c ON c.id_carrera=cp.id_carrera
     JOIN periodo_academico pa ON pa.id_periodo=cp.id_periodo
     WHERE cp.id_carrera_periodo=? LIMIT 1`,
    [id]
  );
  return r[0] || null;
}

async function create(carreraId, periodoId) {
  const okC = await carreraExists(carreraId);
  if (!okC) {
    const e = new Error("carrera no existe");
    e.status = 422;
    throw e;
  }

  const okP = await periodoExists(periodoId);
  if (!okP) {
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }

  const dup = await exists(carreraId, periodoId);
  if (dup) {
    const e = new Error("La relación carrera_periodo ya existe");
    e.status = 409;
    throw e;
  }

  const [res] = await pool.query(
    `INSERT INTO carrera_periodo (id_carrera,id_periodo,estado)
     VALUES (?,?,1)`,
    [carreraId, periodoId]
  );

  return findById(res.insertId);
}

async function update(id, carreraId, periodoId) {
  const current = await findById(id);
  if (!current) {
    const e = new Error("carrera_periodo no existe");
    e.status = 404;
    throw e;
  }

  const okC = await carreraExists(carreraId);
  if (!okC) {
    const e = new Error("carrera no existe");
    e.status = 422;
    throw e;
  }

  const okP = await periodoExists(periodoId);
  if (!okP) {
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }

  const dup = await exists(carreraId, periodoId, id);
  if (dup) {
    const e = new Error("La relación carrera_periodo ya existe");
    e.status = 409;
    throw e;
  }

  await pool.query(
    `UPDATE carrera_periodo
     SET id_carrera=?, id_periodo=?
     WHERE id_carrera_periodo=?`,
    [carreraId, periodoId, id]
  );

  return findById(id);
}

function normalizeEstadoTo01(estado) {
  if (typeof estado === "boolean") return estado ? 1 : 0;
  if (typeof estado === "number") return estado ? 1 : 0;
  const s = String(estado).trim().toLowerCase();
  if (s === "true") return 1;
  if (s === "false") return 0;
  const n = Number(s);
  return n ? 1 : 0;
}

async function setEstado(id, estado) {
  const current = await findById(id);
  if (!current) {
    const e = new Error("carrera_periodo no existe");
    e.status = 404;
    throw e;
  }

  const v = normalizeEstadoTo01(estado);

  await pool.query(
    `UPDATE carrera_periodo SET estado=? WHERE id_carrera_periodo=?`,
    [v, id]
  );

  return findById(id);
}

// ✅ BULK: asignar muchas carreras a un mismo periodo
async function bulkCreateByPeriodo(periodoId, carreraIds = []) {
  const okP = await periodoExists(periodoId);
  if (!okP) {
    const e = new Error("periodo_academico no existe");
    e.status = 422;
    throw e;
  }

  const ids = [...new Set(carreraIds.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0))];
  if (ids.length === 0) {
    const e = new Error("carreraIds vacío o inválido");
    e.status = 422;
    throw e;
  }

  // validar carreras existentes
  const [rows] = await pool.query(
    `SELECT id_carrera FROM carrera WHERE id_carrera IN (${ids.map(() => "?").join(",")})`,
    ids
  );
  const existentes = new Set(rows.map((r) => r.id_carrera));
  const invalidas = ids.filter((id) => !existentes.has(id));
  if (invalidas.length) {
    const e = new Error(`Carreras no existen: ${invalidas.join(", ")}`);
    e.status = 422;
    throw e;
  }

  // crear evitando duplicados: INSERT IGNORE funciona si tienes UNIQUE(id_carrera,id_periodo)
  const values = ids.map(() => "(?,?,1)").join(",");
  const params = ids.flatMap((cid) => [cid, periodoId]);

  const [res] = await pool.query(
    `INSERT IGNORE INTO carrera_periodo (id_carrera, id_periodo, estado) VALUES ${values}`,
    params
  );

  // devolver lista final del periodo
  const createdCount = res.affectedRows || 0;

  const [finalList] = await pool.query(
    `SELECT
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
     JOIN carrera c ON c.id_carrera=cp.id_carrera
     JOIN periodo_academico pa ON pa.id_periodo=cp.id_periodo
     WHERE cp.id_periodo=?
     ORDER BY c.nombre_carrera ASC`,
    [periodoId]
  );

  return { createdCount, items: finalList };
}

module.exports = {
  carreraExists,
  periodoExists,
  exists,
  list,
  findById,
  create,
  update,
  setEstado,
  bulkCreateByPeriodo,
};
