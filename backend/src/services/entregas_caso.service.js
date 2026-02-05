const repo = require("../repositories/entregas_caso.repo");

async function get(cp, id_estudiante, id_caso_estudio) {
  // opcional: validar alcance, pero GET puede mostrar null sin problema
  return repo.getEntrega(id_estudiante, id_caso_estudio);
}

async function upsert(cp, body) {
  const { id_estudiante, id_caso_estudio } = body;

  const ok = await repo.validateEntregaScope(cp, id_estudiante, id_caso_estudio);
  if (!ok) {
    const e = new Error("Entrega fuera de tu carrera-período (estudiante/caso no corresponden)");
    e.status = 403;
    throw e;
  }

  return repo.upsertEntrega(body);
}

module.exports = { get, upsert };
