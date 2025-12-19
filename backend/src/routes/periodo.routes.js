const r=require("express").Router();
const {body,param,query}=require("express-validator");
const v=require("../middlewares/validate.middleware");
const c=require("../controllers/periodo.controller");

r.get("/", query("includeInactive").optional().isBoolean().toBoolean(),
              query("q").optional().isString(),
              query("page").optional().isInt({min:1}).toInt(),
              query("limit").optional().isInt({min:1,max:100}).toInt(),
              v, c.list);

r.get("/:id", param("id").isInt({min:1}).toInt(), v, c.get);

r.post("/",
  body("codigo_periodo").isString().notEmpty(),
  body("fecha_inicio").isISO8601(),
  body("fecha_fin").isISO8601(),
  body("descripcion_periodo").optional().isString(),
  v, c.create);

r.put("/:id",
  param("id").isInt({min:1}).toInt(),
  body("codigo_periodo").isString().notEmpty(),
  body("fecha_inicio").isISO8601(),
  body("fecha_fin").isISO8601(),
  body("descripcion_periodo").optional().isString(),
  v, c.update);

r.patch("/:id/estado",
  param("id").isInt({min:1}).toInt(),
  body("estado").isBoolean().toBoolean(),
  v, c.changeEstado);

module.exports=r;
