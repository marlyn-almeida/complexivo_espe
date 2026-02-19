// backend/src/controllers/nota_teorico.controller.js
const svc = require("../services/nota_teorico.service");

function pickCp(req) {
  // 1) ctx.middleware (lo ideal)
  const ctxCp = req?.ctx?.id_carrera_periodo ?? req?.ctx?.carreraPeriodoId ?? null;

  // 2) headers (axiosClient manda varios)
  const h =
    req?.headers?.["x-id-carrera-periodo"] ??
    req?.headers?.["x-carrera-periodo-id"] ??
    req?.headers?.["x-carrera-periodo"] ??
    req?.headers?.["x-cp-id"] ??
    null;

  // 3) query params (axiosClient también manda)
  const q = req?.query?.id_carrera_periodo ?? req?.query?.carreraPeriodoId ?? null;

  const cp = Number(ctxCp ?? h ?? q ?? 0);
  return Number.isFinite(cp) && cp > 0 ? cp : 0;
}

function normalizeObservacion(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, 400) : null;
}

async function get(req, res, next) {
  try {
    const cp = pickCp(req);
    if (!cp) {
      return res.status(400).json({
        ok: false,
        message: "Falta id_carrera_periodo (ctx/headers/query).",
      });
    }

    const id_estudiante = Number(req.params.id_estudiante);
    const data = await svc.get(cp, id_estudiante);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function upsert(req, res, next) {
  try {
    const cp = pickCp(req);
    if (!cp) {
      return res.status(400).json({
        ok: false,
        message: "Falta id_carrera_periodo (ctx/headers/query).",
      });
    }

    const id_docente_registra = Number(req.user?.id || 0);

    // Normalizamos payload para evitar 422 por "observacion"
    const payload = {
      ...req.body,
      id_estudiante: Number(req.body?.id_estudiante),
      nota_teorico_20: Number(req.body?.nota_teorico_20),
      observacion: normalizeObservacion(req.body?.observacion),
    };

    await svc.upsert(cp, id_docente_registra, payload);

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { get, upsert };
