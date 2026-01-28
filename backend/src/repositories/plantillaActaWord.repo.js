const pool = require("../config/db");

async function list() {
  const [rows] = await pool.query(
    `SELECT 
        id_plantilla AS id,
        nombre,
        descripcion,
        archivo_nombre AS archivoNombre,
        archivo_path AS archivoPath,
        estado_activa AS estadoActivaBit,
        created_at AS createdAt
     FROM plantilla_acta_word
     WHERE estado = 1
     ORDER BY id_plantilla DESC`
  );

  return rows.map(r => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion,
    archivoNombre: r.archivoNombre,
    archivoPath: r.archivoPath,
    estadoActiva: r.estadoActivaBit === 1 ? "ACTIVA" : "INACTIVA",
    createdAt: r.createdAt,
  }));
}

async function create({ nombre, descripcion, archivoNombre, archivoPath }) {
  const [res] = await pool.query(
    `INSERT INTO plantilla_acta_word
      (nombre, descripcion, archivo_nombre, archivo_path, estado_activa, estado)
     VALUES (?, ?, ?, ?, 0, 1)`,  // ✅ siempre INACTIVA
    [nombre, descripcion ?? null, archivoNombre, archivoPath]
  );

  const [rows] = await pool.query(
    `SELECT 
        id_plantilla AS id,
        nombre,
        descripcion,
        archivo_nombre AS archivoNombre,
        archivo_path AS archivoPath,
        estado_activa AS estadoActivaBit,
        created_at AS createdAt
     FROM plantilla_acta_word
     WHERE id_plantilla = ?`,
    [res.insertId]
  );

  const r = rows[0];
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion,
    archivoNombre: r.archivoNombre,
    archivoPath: r.archivoPath,
    estadoActiva: r.estadoActivaBit === 1 ? "ACTIVA" : "INACTIVA",
    createdAt: r.createdAt,
  };
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT 
        id_plantilla AS id,
        nombre,
        descripcion,
        archivo_nombre AS archivoNombre,
        archivo_path AS archivoPath,
        estado_activa AS estadoActivaBit,
        estado,
        created_at AS createdAt
     FROM plantilla_acta_word
     WHERE id_plantilla = ?`,
    [id]
  );
  return rows[0] || null;
}

async function activar(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ apaga todas
    await conn.query(`UPDATE plantilla_acta_word SET estado_activa = 0 WHERE estado = 1`);

    // ✅ enciende solo una
    const [res] = await conn.query(
      `UPDATE plantilla_acta_word SET estado_activa = 1 WHERE id_plantilla = ? AND estado = 1`,
      [id]
    );
    if (res.affectedRows === 0) throw new Error("Plantilla no encontrada o eliminada.");

    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function softDelete(id) {
  const [res] = await pool.query(
    `UPDATE plantilla_acta_word SET estado = 0, estado_activa = 0 WHERE id_plantilla = ?`,
    [id]
  );
  if (res.affectedRows === 0) throw new Error("Plantilla no encontrada.");
  return true;
}

module.exports = { list, create, findById, activar, softDelete };
