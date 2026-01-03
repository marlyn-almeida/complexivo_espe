const router = require("express").Router();

router.get("/whoami", (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;
