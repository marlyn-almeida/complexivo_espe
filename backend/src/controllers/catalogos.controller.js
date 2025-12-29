const repo = require("../repositories/catalogos.repo");

exports.componentes = async (req, res, next) => {
  try {
    const data = await repo.listComponentes({ includeInactive: !!req.query.includeInactive });
    res.json(data);
  } catch (e) { next(e); }
};

exports.criterios = async (req, res, next) => {
  try {
    const data = await repo.listCriterios({ includeInactive: !!req.query.includeInactive });
    res.json(data);
  } catch (e) { next(e); }
};

exports.niveles = async (req, res, next) => {
  try {
    const data = await repo.listNiveles({ includeInactive: !!req.query.includeInactive });
    res.json(data);
  } catch (e) { next(e); }
};
