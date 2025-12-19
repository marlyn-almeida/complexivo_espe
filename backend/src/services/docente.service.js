const bcrypt = require("bcryptjs");
const repo = require("../repositories/docente.repo");

async function list(query = {}) {
  const includeInactive = query.includeInactive === "true";
  const q = query.q || "";
  const page = query.page || 1;
  const limit = query.limit || 50;
  return repo.findAll({ includeInactive, q, page, limit });
}

async function get(id) {
  const doc = await repo.findById(id);
  if (!doc) {
    const err = new Error("Docente no encontrado");
    err.status = 404;
    throw err;
  }
  return doc;
}

async function create(payload) {
  const byInst = await repo.findByInstitucional(payload.id_institucional_docente);
  if (byInst) { const err = new Error("Ya existe un docente con ese ID institucional"); err.status = 409; throw err; }

  const byCedula = await repo.findByCedula(payload.cedula);
  if (byCedula) { const err = new Error("Ya existe un docente con esa cédula"); err.status = 409; throw err; }

  const byUser = await repo.findByUsername(payload.nombre_usuario);
  if (byUser) { const err = new Error("Ya existe un docente con ese nombre de usuario"); err.status = 409; throw err; }

  let passwordPlano = payload.password;
  if (!passwordPlano || !passwordPlano.trim()) passwordPlano = payload.nombre_usuario;

  if (passwordPlano.trim().length < 6) {
    const err = new Error("Password inicial mínimo 6 caracteres (puede ser el username si cumple)");
    err.status = 422;
    throw err;
  }

  const passwordHash = await bcrypt.hash(passwordPlano, 10);

  return repo.create({
    id_institucional_docente: payload.id_institucional_docente,
    cedula: payload.cedula,
    nombres_docente: payload.nombres_docente,
    apellidos_docente: payload.apellidos_docente,
    correo_docente: payload.correo_docente ?? null,
    telefono_docente: payload.telefono_docente ?? null,
    nombre_usuario: payload.nombre_usuario,
    passwordHash
  });
}

async function update(id, payload) {
  await get(id);

  const byInst = await repo.findByInstitucional(payload.id_institucional_docente);
  if (byInst && Number(byInst.id_docente) !== Number(id)) {
    const err = new Error("Ya existe un docente con ese ID institucional");
    err.status = 409;
    throw err;
  }

  const byCedula = await repo.findByCedula(payload.cedula);
  if (byCedula && Number(byCedula.id_docente) !== Number(id)) {
    const err = new Error("Ya existe un docente con esa cédula");
    err.status = 409;
    throw err;
  }

  const byUser = await repo.findByUsername(payload.nombre_usuario);
  if (byUser && Number(byUser.id_docente) !== Number(id)) {
    const err = new Error("Ya existe un docente con ese nombre de usuario");
    err.status = 409;
    throw err;
  }

  return repo.update(id, {
    id_institucional_docente: payload.id_institucional_docente,
    cedula: payload.cedula,
    nombres_docente: payload.nombres_docente,
    apellidos_docente: payload.apellidos_docente,
    correo_docente: payload.correo_docente ?? null,
    telefono_docente: payload.telefono_docente ?? null,
    nombre_usuario: payload.nombre_usuario
  });
}

async function changeEstado(id, estado) {
  await get(id);
  return repo.setEstado(id, estado);
}

module.exports = { list, get, create, update, changeEstado };
