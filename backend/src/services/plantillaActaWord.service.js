const repo = require("../repositories/plantillaActaWord.repo");

function nonEmpty(v, msg) {
  if (!v || !String(v).trim()) throw new Error(msg);
  return String(v).trim();
}

async function listPlantillas() {
  return repo.list();
}

async function crearPlantilla({ nombre, descripcion, file }) {
  const nombreClean = nonEmpty(nombre, "El nombre es obligatorio.");

  if (!file) throw new Error("Debe enviar un archivo .docx.");

  const original = (file.originalname || "").toLowerCase();
  if (!original.endsWith(".docx"))
    throw new Error("Formato no válido. Solo se admite .docx.");

  const archivoNombre = file.originalname;
  const archivoPath = file.path.replace(/\\/g, "/");

  return repo.create({
    nombre: nombreClean,
    descripcion: descripcion?.trim() || null,
    archivoNombre,
    archivoPath,
  });
}

async function activarPlantilla(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error("ID inválido.");

  // ✅ solo una activa
  await repo.activar(n);
  return true;
}

/**
 * ✅ NUEVO: desactivar
 * - deja esa plantilla inactiva
 */
async function desactivarPlantilla(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error("ID inválido.");

  await repo.desactivar(n);
  return true;
}

async function eliminarPlantilla(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error("ID inválido.");

  await repo.softDelete(n);
  return true;
}

async function obtenerParaDescarga(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) throw new Error("ID inválido.");

  const p = await repo.findById(n);
  if (!p || p.estado !== 1)
    throw new Error("Plantilla no encontrada.");

  return p;
}

module.exports = {
  listPlantillas,
  crearPlantilla,
  activarPlantilla,
  desactivarPlantilla,
  eliminarPlantilla,
  obtenerParaDescarga,
};
