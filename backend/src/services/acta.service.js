const actaRepo = require("../repositories/acta.repo");
const calRepo = require("../repositories/calificacion.repo");
const calService = require("./calificacion.service");

function letras(n){
  // simple, luego lo mejoramos
  return `Nota final: ${Number(n).toFixed(2)}/20`;
}

async function generarDesdeTribunalEstudiante({ id_tribunal_estudiante, id_rubrica, fecha_acta=null, umbral_aprobacion=14 }) {
  // coherencia rubrica vs te
  await calService.validarCoherencia(id_tribunal_estudiante, id_rubrica);

  const teorico = await calRepo.findOneByKey(id_tribunal_estudiante, id_rubrica, "TEORICO");
  const escrita = await calRepo.findOneByKey(id_tribunal_estudiante, id_rubrica, "PRACTICO_ESCRITA");
  const oral = await calRepo.findOneByKey(id_tribunal_estudiante, id_rubrica, "PRACTICO_ORAL");

  if (!teorico && !escrita && !oral) {
    const e = new Error("No existen calificaciones TEORICO/PRACTICO_ESCRITA/PRACTICO_ORAL para generar el acta");
    e.status = 422; throw e;
  }

  // regla simple: promedio de las existentes (puedes cambiar a ponderaciones luego)
  const notas = [teorico, escrita, oral].filter(Boolean).map(x => Number(x.nota_base20));
  const final = Number((notas.reduce((a,b)=>a+b,0) / notas.length).toFixed(2));

  // creamos/actualizamos la calificación FINAL (para que acta apunte a una sola calificación)
  const calFinal = await calRepo.upsertByKey({
    id_tribunal_estudiante,
    id_rubrica,
    tipo_rubrica: "FINAL",
    nota_base20: final,
    observacion: "Generada automáticamente para acta"
  });

  const payloadActa = {
    id_calificacion: calFinal.id_calificacion,
    nota_teorico_20: teorico?.nota_base20 ?? null,
    nota_practico_escrita_20: escrita?.nota_base20 ?? null,
    nota_practico_oral_20: oral?.nota_base20 ?? null,
    calificacion_final: final,
    calificacion_final_letras: letras(final),
    aprobacion: final >= umbral_aprobacion ? 1 : 0,
    fecha_acta: fecha_acta,
    estado_acta: "BORRADOR"
  };

  const existente = await actaRepo.findByCalificacion(calFinal.id_calificacion);
  if (existente) return actaRepo.updateById(existente.id_acta, payloadActa);
  return actaRepo.create(payloadActa);
}

async function get(id){
  const a = await actaRepo.findById(id);
  if(!a){ const e=new Error("Acta no encontrada"); e.status=404; throw e; }
  return a;
}

async function changeEstado(id, estado){ await get(id); return actaRepo.setEstado(id, estado); }

module.exports = { generarDesdeTribunalEstudiante, get, changeEstado };
