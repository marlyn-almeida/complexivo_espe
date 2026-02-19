// ✅ backend/src/middlewares/validate.middleware.js
const { validationResult } = require("express-validator");

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      ok: false,
      message: "Validación fallida",
      errors: errors.array({ onlyFirstError: true }).map((e) => ({
        field: e.path,
        msg: e.msg,
      })),
    });
  }

  next();
}

module.exports = validate;
