const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");
const repo = require("../repositories/carrera.repo");

// LISTAR
router.get(
  "/",
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  validate,
  async (req, res) => {
    const data = await repo.findAll(req.query);
    res.json(data);
  }
);

// CREAR
router.post(
  "/",
  body("nombre_carrera").isString().notEmpty().isLength({ max: 120 }),
  body("codigo_carrera").isString().notEmpty().isLength({ max: 30 }),
  body("id_departamento").isInt(),
  body("modalidad").optional().isIn(["En línea", "Presencial"]),
  body("sede").optional().isString(),
  validate,
  async (req, res) => {
    const { nombre_carrera, codigo_carrera, id_departamento } = req.body;

    if (await repo.findByNombre(nombre_carrera)) {
      return res.status(400).json({ message: "La carrera ya existe" });
    }

    if (await repo.findByCodigo(codigo_carrera)) {
      return res.status(400).json({ message: "El código ya existe" });
    }

    if (!(await repo.departamentoExists(id_departamento))) {
      return res.status(400).json({ message: "Departamento inválido" });
    }

    const carrera = await repo.create(req.body);
    res.status(201).json(carrera);
  }
);

// EDITAR
router.put(
  "/:id",
  param("id").isInt(),
  body("nombre_carrera").isString().notEmpty(),
  body("codigo_carrera").isString().notEmpty(),
  body("id_departamento").isInt(),
  validate,
  async (req, res) => {
    const carrera = await repo.update(req.params.id, req.body);
    res.json(carrera);
  }
);

// CAMBIAR ESTADO
router.patch(
  "/:id/estado",
  param("id").isInt(),
  body("estado").isIn([0, 1]),
  validate,
  async (req, res) => {
    const carrera = await repo.setEstado(req.params.id, req.body.estado);
    res.json(carrera);
  }
);

module.exports = router;
