const bcrypt = require("bcryptjs");
const docenteRepo = require("../repositories/docente.repo");

async function me(user) {
  const docente = await docenteRepo.findProfileById(user.id);
  if (!docente) {
    const e = new Error("Perfil no encontrado");
    e.status = 404;
    throw e;
  }

  const roles = await docenteRepo.getRolesByDocenteId(user.id);

  return {
    docente,
    roles,
    activeRole: user.activeRole ?? user.rol ?? null,
  };
}

async function changePassword(user, payload) {
  const { newPassword, confirmPassword } = payload;

  if (!newPassword || String(newPassword).trim().length < 6) {
    const e = new Error("Mínimo 6 caracteres");
    e.status = 422;
    throw e;
  }

  if (newPassword !== confirmPassword) {
    const e = new Error("Las contraseñas no coinciden");
    e.status = 422;
    throw e;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await docenteRepo.updatePassword(user.id, hash);

  return { ok: true, message: "Contraseña actualizada" };
}

module.exports = { me, changePassword };
