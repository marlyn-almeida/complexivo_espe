const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const docenteRepo = require("../repositories/docente.repo");

// POST /api/auth/login
router.post(
  "/login",
  body("username").isString().trim().notEmpty(),
  body("password").isString().notEmpty(),
  validate,
  async (req, res) => {
    const { username, password } = req.body;

    // Buscar docente por username
    const user = await docenteRepo.findAuthByUsername(username);
    if (!user || user.estado !== 1) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // Validar la contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // Si debe cambiar la contraseña
    if (user.debe_cambiar_password === 1) {
      const tempToken = jwt.sign(
        { id: user.id_docente, purpose: "CHANGE_PASSWORD" },
        process.env.TEMP_JWT_SECRET,
        { expiresIn: "10m" }
      );

      return res.json({
        mustChangePassword: true,
        tempToken
      });
    }

    // Si ya no debe cambiar contraseña, se emite el token normal
    const accessToken = jwt.sign(
      { id: user.id_docente },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({ mustChangePassword: false, accessToken });
  }
);

// PATCH /api/auth/change-password
router.patch(
  "/change-password",
  body("tempToken").isString().notEmpty(),
  body("newPassword").isString().isLength({ min: 6 }),
  validate,
  async (req, res) => {
    const { tempToken, newPassword } = req.body;

    // Verificar que el token temporal sea válido
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.TEMP_JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Token temporal inválido o expirado" });
    }

    if (decoded.purpose !== "CHANGE_PASSWORD") {
      return res.status(401).json({ message: "Token temporal no válido para este propósito" });
    }

    // Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña y marcar que ya no debe cambiarla
    await docenteRepo.updatePasswordAndClearFlag(decoded.id, passwordHash);

    // Emitir el JWT normal después de cambiar la contraseña
    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({ accessToken });
  }
);

module.exports = router;
