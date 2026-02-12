// ✅ src/controllers/mis_calificaciones.controller.js
const service = require("../services/mis_calificaciones.service");

/** helper: sacar CP sin depender de un nombre exacto */
function getCP(req) {
  return (
    Number(req?.carreraPeriodo) ||
    Number(req?.carreraPeriodoId) ||
    Number(req?.ctx?.id_carrera_periodo) ||
    Number(req?.query?.id_carrera_periodo) ||   // ✅ por si viene por query
    Number(req?.query?.carreraPeriodoId) ||     // ✅ por si viene por query
    Number(req?.user?.scope?.id_carrera_periodo) ||
    0
  );
}

function sendErr(res, err) {
  const status = Number(err?.status || err?.statusCode || 500);
  const msg =
    err?.message ||
    (status === 403 ? "Acceso denegado" : status === 409 ? "Conflicto" : "Error interno");
  return res.status(status).json({ ok: false, message: msg });
}

/**
 * ✅ ADMIN (ROL 2)
 * GET /mis-calificaciones
 *
 * Lista estudiantes del CP aunque NO tengan tribunal.
 * - Nota teórica independiente del tribunal
 * - PDF depende de CASO (estudiante_caso_asignacion + estudiante_caso_entrega)
 * - Tribunal (si existe) es informativo (no bloquea)
 */
async function list(req, res) {
  try {
    const cp = getCP(req);
    if (!cp) return res.status(400).json({ ok: false, message: "id_carrera_periodo requerido" });

    const data = await service.listByCP(cp);
    return res.json({ ok: true, data });
  } catch (err) {
    return sendErr(res, err);
  }
}

/**
 * ✅ DOCENTE (ROL 3)
 * GET /mis-calificaciones/:idTribunalEstudiante
 */
async function getForDocente(req, res) {
  try {
    const idTribunalEstudiante = Number(req.params.idTribunalEstudiante || 0);
    if (!idTribunalEstudiante) {
      return res.status(400).json({ ok: false, message: "idTribunalEstudiante inválido" });
    }

    const user = req.user;
    const data = await service.getForDocente(idTribunalEstudiante, user);

    if (!data) return res.status(404).json({ ok: false, message: "No encontrado" });
    return res.json({ ok: true, data });
  } catch (err) {
    return sendErr(res, err);
  }
}

/**
 * ✅ DOCENTE (ROL 3)
 * POST /mis-calificaciones/:idTribunalEstudiante
 */
async function saveForDocente(req, res) {
  try {
    const idTribunalEstudiante = Number(req.params.idTribunalEstudiante || 0);
    if (!idTribunalEstudiante) {
      return res.status(400).json({ ok: false, message: "idTribunalEstudiante inválido" });
    }

    const user = req.user;
    await service.saveForDocente(idTribunalEstudiante, user, req.body);

    return res.json({ ok: true, message: "Guardado" });
  } catch (err) {
    return sendErr(res, err);
  }
}

module.exports = {
  list,
  getForDocente,
  saveForDocente,
};
