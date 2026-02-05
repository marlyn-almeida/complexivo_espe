const svc = require("../services/casos_estudio.service");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/casos-estudio");

// asegúrate que exista
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function list(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const includeInactive = req.query.includeInactive === true;
    const data = await svc.list(cp, includeInactive);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);

    if (!req.file) {
      const e = new Error("Debe adjuntar el archivo PDF del caso de estudio");
      e.status = 422;
      throw e;
    }

    // 🔹 guardar archivo
    const filename = `${Date.now()}_${req.file.originalname}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const payload = {
      numero_caso: Number(req.body.numero_caso),
      titulo: req.body.titulo || null,
      descripcion: req.body.descripcion || null,
      archivo_nombre: req.file.originalname,
      archivo_path: `/uploads/casos-estudio/${filename}`,
    };

    const id = await svc.create(cp, payload);

    res.status(201).json({ ok: true, id });
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const cp = Number(req.ctx.id_carrera_periodo);
    const id_caso_estudio = Number(req.params.id_caso_estudio);

    const patch = {
      numero_caso: req.body.numero_caso ? Number(req.body.numero_caso) : undefined,
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
    };

    // 🔹 si viene nuevo archivo
    if (req.file) {
      const filename = `${Date.now()}_${req.file.originalname}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      fs.writeFileSync(filepath, req.file.buffer);

      patch.archivo_nombre = req.file.originalname;
      patch.archivo_path = `/uploads/casos-estudio/${filename}`;
    }

    await svc.update(cp, id_caso_estudio, patch);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, update };
