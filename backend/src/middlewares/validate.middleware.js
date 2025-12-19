const { validationResult } = require("express-validator");

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validación fallida",
      errors: errors.array().map(e => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
}

module.exports = validate;
