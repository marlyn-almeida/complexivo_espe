// ✅ src/controllers/entregas_caso.controller.js
const path = require("path");
const fs = require("fs");
const service = require("../services/entregas_caso.service");

function httpErr(res, e) {
  const status = Number(e?.status || 500);
  return res.status(status).json({ ok: false, message: e?.message || "Error interno" });
}

/** ✅ CP viene del ctx.middleware (ADMIN). */
function getCpFromReq(req) {
  return Number(req?.ctx?.id_carrera_periodo || 0);
}

/** ✅ convierte archivo_path (relativo o absoluto) a ruta absoluta real */
function resolveAbsolutePath(archivo_path) {
  if (!archivo_path) return null;

  // si ya es absoluta
  if (path.isAbsolute(archivo_path)) return archivo_path;

  // normaliza separadores y arma absoluta desde el root del proyecto
  const clean = String(archivo_path).replace(/^\/+/, ""); // quita / inicial si viene "/uploads/.."
  return path.join(process.cwd(), clean);
}

/**
 * ✅ GET /entregas-caso/:id_estudiante
 * JSON metadata (ya lo usas en algunos lados)
 */
async function get(req, res) {
  try {
    const cp = getCpFromReq(req);
    const id_estudiante = Number(req.params.id_estudiante || 0);

    if (!cp) return res.status(400).json({ ok: false, message: "id_carrera_periodo requerido" });
    if (!id_estudiante) return res.status(400).json({ ok: false, message: "id_estudiante inválido" });

    const data = await service.get(cp, id_estudiante, req.user);
    return res.json({ ok: true, data });
  } catch (e) {
    return httpErr(res, e);
  }
}

/**
 * ✅ GET /entregas-caso/:id_estudiante/download
 * PDF inline (para "Ver") y sirve igual para "Descargar" (frontend crea blob)
 */
async function download(req, res) {
  try {
    const cp = getCpFromReq(req);
    const id_estudiante = Number(req.params.id_estudiante || 0);

    if (!cp) return res.status(400).json({ ok: false, message: "id_carrera_periodo requerido" });
    if (!id_estudiante) return res.status(400).json({ ok: false, message: "id_estudiante inválido" });

    // ✅ valida permisos + trae entrega con archivo_path
    const entrega = await service.getForDownload(cp, id_estudiante, req.user);

    // ✅ ruta absoluta correcta
    const abs = resolveAbsolutePath(entrega.archivo_path);

    if (!abs || !fs.existsSync(abs)) {
      return res.status(404).json({
        ok: false,
        message: "Archivo PDF no encontrado en el servidor (archivo_path inválido o archivo borrado).",
      });
    }

    // ✅ headers correctos para PDF
    res.setHeader("Content-Type", "application/pdf");

    // inline => se ve en nueva pestaña
    // (si quisieras forzar descarga desde backend, cambia inline por attachment)
    const filename = entrega.archivo_nombre || `entrega_${id_estudiante}.pdf`;
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);

    return res.sendFile(abs);
  } catch (e) {
    return httpErr(res, e);
  }
}

/**
 * ✅ POST /entregas-caso/by-estudiante
 * (NO te cambio la lógica: solo dejo un handler estándar)
 */
async function upsert(req, res) {
  try {
    const cp = getCpFromReq(req);

    if (!cp) return res.status(400).json({ ok: false, message: "id_carrera_periodo requerido" });

    // aquí normalmente tu controller arma: { id_estudiante, archivo_nombre, archivo_path, observacion }
    // y llama service.upsert(...)
    const saved = await service.upsert(
      cp,
      {
        id_estudiante: Number(req.body.id_estudiante),
        archivo_nombre: req.body.archivo_nombre,
        archivo_path: req.body.archivo_path,
        observacion: req.body.observacion,
      },
      req.user
    );

    return res.json({ ok: true, data: saved, message: "Entrega guardada" });
  } catch (e) {
    return httpErr(res, e);
  }
}

module.exports = { get, download, upsert };
