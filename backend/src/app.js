// ✅ server.js — COMPLETO (LIMPIO Y CONSISTENTE)
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { auth } = require("./middlewares/auth.middleware");
const { attachScope } = require("./middlewares/scope.middleware");

const app = express();

// =========================
// Middlewares base
// =========================
app.use(cors());
app.use(express.json());

// =========================
// ✅ UPLOADS STATIC (PUBLICO)
// =========================
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

// carpetas mínimas (puedes agregar más si quieres)
const UPLOADS_CASOS = path.join(UPLOADS_ROOT, "casos-estudio");
const UPLOADS_ACTAS = path.join(UPLOADS_ROOT, "actas");
const UPLOADS_PLANTILLAS = path.join(UPLOADS_ROOT, "plantillas");

try {
  if (!fs.existsSync(UPLOADS_ROOT)) fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
  if (!fs.existsSync(UPLOADS_CASOS)) fs.mkdirSync(UPLOADS_CASOS, { recursive: true });
  if (!fs.existsSync(UPLOADS_ACTAS)) fs.mkdirSync(UPLOADS_ACTAS, { recursive: true });
  if (!fs.existsSync(UPLOADS_PLANTILLAS)) fs.mkdirSync(UPLOADS_PLANTILLAS, { recursive: true });
} catch (e) {
  console.error("⚠️ No se pudo crear carpeta uploads:", e);
}

// ✅ Servir /uploads públicamente
// Ej: http://localhost:3001/uploads/actas/acta_1_12345.docx
app.use("/uploads", express.static(UPLOADS_ROOT));

// =========================
// RUTAS PÚBLICAS
// =========================
app.use("/api/auth", require("./routes/auth.routes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API funcionando" });
});

// =========================
// RUTAS PROTEGIDAS (JWT + Scope)
// =========================
const protectedApi = express.Router();

// ✅ Global SOLO aquí:
// 1) auth → carga req.user
// 2) attachScope → carga req.user.scope (ctx admin carrera_periodo si aplica)
protectedApi.use(auth, attachScope);

// ---- base
protectedApi.use("/perfil", require("./routes/perfil.routes"));

// =========================
// ROLES (solo SUPER_ADMIN dentro de sus routes)
// =========================
protectedApi.use("/roles", require("./routes/rol.routes"));

// =========================
// DOCENTES
// =========================
protectedApi.use("/docentes", require("./routes/docente.routes"));
protectedApi.use("/", require("./routes/docenteRoles.routes")); // asignación roles docente (si lo usas así)

// =========================
// CATÁLOGOS PRINCIPALES
// =========================
protectedApi.use("/carreras", require("./routes/carrera.routes"));
protectedApi.use("/departamentos", require("./routes/departamento.routes"));

protectedApi.use("/periodos", require("./routes/periodo.routes"));
protectedApi.use("/carreras-periodos", require("./routes/carrera_periodo.routes"));
protectedApi.use("/estudiantes", require("./routes/estudiante.routes"));

// =========================
// OPERACIÓN COMPLEXIVO
// =========================
protectedApi.use("/franjas-horarias", require("./routes/franja_horario.routes"));
protectedApi.use("/carreras-docentes", require("./routes/carrera_docente.routes"));

protectedApi.use("/tribunales", require("./routes/tribunal.routes"));
protectedApi.use("/tribunales-estudiantes", require("./routes/tribunal_estudiante.routes"));

protectedApi.use(
  "/estudiante-caso-asignacion",
  require("./routes/estudiante_caso_asignacion.routes")
);

protectedApi.use("/calificaciones", require("./routes/calificacion.routes"));
protectedApi.use("/actas", require("./routes/acta.routes"));

// =========================
// PLANTILLAS ACTA WORD
// =========================
protectedApi.use("/plantillas-acta", require("./routes/plantillaActaWord.routes"));

// =========================
// ✅ NUEVOS MÓDULOS (ROL 2)
// =========================
protectedApi.use("/casos-estudio", require("./routes/casos_estudio.routes"));
protectedApi.use("/entregas-caso", require("./routes/entregas_caso.routes"));
protectedApi.use("/plan-evaluacion", require("./routes/plan_evaluacion.routes"));
protectedApi.use("/calificadores-generales", require("./routes/calificadores_generales.routes"));
protectedApi.use("/nota-teorico", require("./routes/nota_teorico.routes"));
protectedApi.use("/ponderaciones-examen", require("./routes/ponderacion.routes"));

// ✅ ✅ ✅ MIS CALIFICACIONES (ROL 2)
protectedApi.use("/mis-calificaciones", require("./routes/mis_calificaciones.routes"));

// =========================
// RÚBRICAS (1 rubrica por período)
// =========================
protectedApi.use("/rubricas", require("./routes/rubrica.routes"));
protectedApi.use("/rubricas/:rubricaId/niveles", require("./routes/rubrica_nivel.routes"));
protectedApi.use("/rubricas/:rubricaId/componentes", require("./routes/rubrica_componente.routes"));
protectedApi.use("/componentes/:componenteId/criterios", require("./routes/rubrica_criterio.routes"));
protectedApi.use("/criterios/:criterioId/niveles", require("./routes/rubrica_criterio_nivel.routes"));

// Catálogos legacy (si aún existen)
protectedApi.use("/componentes", require("./routes/componente.routes"));
protectedApi.use("/criterios", require("./routes/criterio.routes"));
protectedApi.use("/niveles", require("./routes/nivel.routes"));
protectedApi.use("/", require("./routes/catalogos.routes"));

// Debug opcional
protectedApi.get("/debug/whoami", (req, res) => {
  res.json({ ok: true, user: req.user, ctx: req.ctx });
});

// Montar router protegido
app.use("/api", protectedApi);

// =========================
// 404 JSON
// =========================
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

// =========================
// Error handler GLOBAL
// =========================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  const status = err.status || 500;

  res.status(status).json({
    ok: false,
    message: err.message || "Internal Server Error",
    // en prod puedes comentar esto:
    stack: err.stack,
  });
});

// =========================
// Start
// =========================
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor activo en puerto ${PORT}`);
  console.log("📁 Uploads root:", UPLOADS_ROOT);
});
