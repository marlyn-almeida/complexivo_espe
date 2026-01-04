// src/controllers/auth.controller.js
const s = require("../services/auth.service");

module.exports = {
  login: async (req, res, n) => {
    try {
      const data = await s.login(req.body);
      res.json(data);
    } catch (e) {
      n(e);
    }
  },
};
