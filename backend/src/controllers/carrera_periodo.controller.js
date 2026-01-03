const service = require("../services/carrera_periodo.service");
const { validationResult } = require("express-validator");

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validación fallida",
      errors: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  return null;
}

async function resumen(req, res, next) {
  try {
    const data = await service.resumen(req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function porPeriodo(req, res, next) {
  try {
    const data = await service.listByPeriodo({
      ...req.query,
      periodoId: req.params.periodoId,
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function bulk(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const result = await service.bulkAssign(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

async function sync(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const result = await service.syncPeriodo(req.body);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
}

/**
 * ✅ GET /api/carreras-periodos/list
 * - Rol 1: devuelve todo (según filtros)
 * - Rol 2: devuelve SOLO carrera_periodo de su carrera (scope.id_carrera)
 */
async function list(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const q = (req.query.q || "").trim();
    const periodoId = req.query.periodoId ? Number(req.query.periodoId) : null;

    const activeRole = req.user?.activeRole ?? req.user?.rol ?? null;

    // ✅ si es rol 2, filtro por carrera del scope
    const scopeCarreraId =
      Number(activeRole) === 2 ? Number(req.user?.scope?.id_carrera || 0) : null;

    const data = await service.list({
      includeInactive,
      q,
      periodoId,
      scopeCarreraId: scopeCarreraId || null,
    });

    res.json(data);
  } catch (e) {
    next(e);
  }
}

/**
 * ✅ GET /api/carreras-periodos/mis-activos
 * SOLO rol 2: devuelve carrera_periodo activos de su carrera
 * Sirve para "contexto de trabajo".
 */
async function misActivos(req, res, next) {
  try {
    const data = await service.misActivos(req.user);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

// ✅ GET /api/carreras-periodos/:idCarreraPeriodo/admin
async function getAdmins(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const data = await service.getAdmins(req.params.idCarreraPeriodo);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

// ✅ PUT /api/carreras-periodos/:idCarreraPeriodo/admin
async function setAdmins(req, res, next) {
  try {
    if (handleValidation(req, res)) return;
    const data = await service.setAdmins(req.params.idCarreraPeriodo, req.body);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  resumen,
  porPeriodo,
  bulk,
  sync,
  list,
  misActivos,
  getAdmins,
  setAdmins,
};
