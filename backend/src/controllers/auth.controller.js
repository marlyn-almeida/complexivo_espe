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

  activeRole: async (req, res, n) => {
    try {
      const data = await s.setActiveRole(req.user, req.body);
      res.json(data);
    } catch (e) {
      n(e);
    }
  },

  changePassword: async (req, res, n) => {
    try {
      const data = await s.changePassword(req.body);
      res.json(data);
    } catch (e) {
      n(e);
    }
  },
};
