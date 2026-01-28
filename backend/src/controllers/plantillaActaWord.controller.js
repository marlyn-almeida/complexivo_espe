const service = require("../services/plantillaActaWord.service");

async function list(req, res, next) {
  try {
    const data = await service.listPlantillas();
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;
    const data = await service.crearPlantilla({
      nombre,
      descripcion,
      file: req.file,
    });
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function activar(req, res, next) {
  try {
    await service.activarPlantilla(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

/**
 * ✅ NUEVO: desactivar plantilla
 * - Apaga TODAS o al menos esa (según repo)
 */
async function desactivar(req, res, next) {
  try {
    await service.desactivarPlantilla(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    await service.eliminarPlantilla(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function download(req, res, next) {
  try {
    const p = await service.obtenerParaDescarga(req.params.id);
    return res.download(p.archivoPath, p.archivoNombre);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  list,
  create,
  activar,
  desactivar,
  remove,
  download,
};
