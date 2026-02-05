const repo = require("../repositories/nota_teorico.repo");

async function get(cp, id_estudiante) {
  return repo.getByEstudianteCp(id_estudiante, cp);
}

async function upsert(cp, id_docente_registra, body) {
  const ok = await repo.validateEstudianteEnCP(body.id_estudiante, cp);
  if (!ok) {
    const e = new Error("El estudiante no pertenece a tu carrera-período");
    e.status = 403;
    throw e;
  }

  return repo.upsert({
    id_estudiante: body.id_estudiante,
    id_carrera_periodo: cp,              // ✅ cp desde ctx
    nota_teorico_20: body.nota_teorico_20,
    observacion: body.observacion,
    id_docente_registra,                 // ✅ del token
  });
}

module.exports = { get, upsert };
