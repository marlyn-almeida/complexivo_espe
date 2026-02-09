// src/controllers/mis_calificaciones.controller.js
const service = require("../services/mis_calificaciones.service");

/** helper: sacar CP sin depender de un nombre exacto */
function getCP(req) {
  // según cómo lo tengas en ctx.middleware:
  // - req.carreraPeriodo (number)
  // - req.carreraPeriodoId
  // - req.ctx.id_carrera_periodo
  // - req.scope?.id_carrera_periodo
  // etc
  return (
    Number(req?.carreraPeriodo) ||
    Number(req?.carreraPeriodoId) ||
    Number(req?.ctx?.id_carrera_periodo) ||
    Number(req?.ctx?.id_carrera_periodo) ||
    Number(req?.user?.scope?.id_carrera_periodo) ||
    0
  );
}

function sendErr(res, err) {
  const status = Number(err?.status || err?.statusCode || 500);
  const msg =
    err?.message ||
    (status === 403
      ? "Acceso denegado"
      : status === 409
      ? "Conflicto"
      : "Error interno");
  return res.status(status).json({ message: msg });
}

/**
 * ✅ ADMIN
 */
exports.list = async (req, res) => {
  try {
    const cp = getCP(req);
    if (!cp) return res.status(400).json({ message: "id_carrera_periodo requerido" });

    const data = await service.listByCP(cp);
    return res.json({ ok: true, data });
  } catch (err) {
    return sendErr(res, err);
  }
};

/**
 * ✅ DOCENTE: estructura para calificar
 */
exports.getForDocente = async (req, res) => {
  try {
    const cp = getCP(req);
    if (!cp) return res.status(400).json({ message: "id_carrera_periodo requerido" });

    const idTribunalEstudiante = Number(req.params.idTribunalEstudiante);
    const user = req.user;

    const data = await service.getForDocente(cp, idTribunalEstudiante, user);

    if (!data) return res.status(404).json({ message: "No encontrado" });

    return res.json({ ok: true, data });
  } catch (err) {
    return sendErr(res, err);
  }
};

/**
 * ✅ DOCENTE: guardar calificaciones
 */
exports.saveForDocente = async (req, res) => {
  try {
    const cp = getCP(req);
    if (!cp) return res.status(400).json({ message: "id_carrera_periodo requerido" });

    const idTribunalEstudiante = Number(req.params.idTribunalEstudiante);
    const user = req.user;

    await service.saveForDocente(cp, idTribunalEstudiante, user, req.body);

    return res.json({ ok: true, message: "Guardado" });
  } catch (err) {
    return sendErr(res, err);
  }
};
