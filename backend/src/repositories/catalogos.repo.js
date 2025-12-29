const pool = require("../config/db");

exports.listComponentes = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? "" : "WHERE estado=1";
  const [rows] = await pool.query(
    `SELECT id_componente AS id, nombre_componente AS nombre, estado
     FROM componente ${where}
     ORDER BY nombre_componente ASC`
  );
  return rows;
};

exports.listCriterios = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? "" : "WHERE estado=1";
  const [rows] = await pool.query(
    `SELECT id_criterio AS id, nombre_criterio AS nombre, orden_criterio, estado
     FROM criterio ${where}
     ORDER BY orden_criterio ASC, nombre_criterio ASC`
  );
  return rows;
};

exports.listNiveles = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? "" : "WHERE estado=1";
  const [rows] = await pool.query(
    `SELECT id_nivel AS id, nombre_nivel AS nombre, valor_nivel, orden_nivel, estado
     FROM nivel ${where}
     ORDER BY orden_nivel ASC, valor_nivel ASC`
  );
  return rows;
};
