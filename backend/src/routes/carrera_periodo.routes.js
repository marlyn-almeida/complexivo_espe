const r=require("express").Router();
const {body,param,query}=require("express-validator");
const v=require("../middlewares/validate.middleware");
const c=require("../controllers/carrera_periodo.controller");

r.get("/",
  query("carreraId").optional().isInt({min:1}).toInt(),
  query("periodoId").optional().isInt({min:1}).toInt(),
  v, c.list);

r.post("/",
  body("id_carrera").isInt({min:1}).toInt(),
  body("id_periodo").isInt({min:1}).toInt(),
  v, c.create);

r.patch("/:id/estado",
  param("id").isInt({min:1}).toInt(),
  body("estado").isBoolean().toBoolean(),
  v, c.changeEstado);

module.exports=r;
