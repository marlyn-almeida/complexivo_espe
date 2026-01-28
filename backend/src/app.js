const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { auth } = require("./middlewares/auth.middleware");
const { attachScope } = require("./middlewares/scope.middleware");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// =========================
// RUTAS PÚBLICAS
// =========================
app.use("/api/auth", require("./routes/auth.routes"));

// Health check (para Render)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API funcionando" });
});

// =========================
// RUTAS PROTEGIDAS (JWT + SCOPE rol 2)
// =========================
const protectedApi = express.Router();
protectedApi.use(auth, attachScope);

// OJO: desde aquí todo requiere token
protectedApi.use("/perfil", require("./routes/perfil.routes"));

// =========================
// ROLES (solo SUPER_ADMIN dentro de sus routes)
// =========================
protectedApi.use("/roles", require("./routes/rol.routes"));

// =========================
// DOCENTES (tu módulo existente)
// =========================
protectedApi.use("/docentes", require("./routes/docente.routes"));

// ✅ NUEVO: Asignación de Roles a Docentes (solo SUPER_ADMIN)
// Rutas:
//   GET  /api/docentes/:id/roles
//   PUT  /api/docentes/:id/roles
// Nota: Este router define rutas completas con /docentes/:id/roles,
// por eso se monta en "/" y no en "/docentes"
protectedApi.use("/", require("./routes/docenteRoles.routes"));

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

protectedApi.use("/calificaciones", require("./routes/calificacion.routes"));
protectedApi.use("/actas", require("./routes/acta.routes"));
// ✅ PLANTILLAS ACTA WORD
protectedApi.use("/plantillas-acta", require("./routes/plantillaActaWord.routes"));

// =========================
// RÚBRICAS (nuevo flujo: 1 rubrica por período)
// =========================
protectedApi.use("/rubricas", require("./routes/rubrica.routes"));

// Niveles dentro de una rúbrica (rubrica_nivel)
protectedApi.use("/rubricas/:rubricaId/niveles", require("./routes/rubrica_nivel.routes"));

// Componentes dentro de una rúbrica (rubrica_componente)
protectedApi.use("/rubricas/:rubricaId/componentes", require("./routes/rubrica_componente.routes"));

// Criterios dentro de un componente (rubrica_criterio)
protectedApi.use("/componentes/:componenteId/criterios", require("./routes/rubrica_criterio.routes"));

// Descripciones por nivel dentro de un criterio (rubrica_criterio_nivel)
protectedApi.use("/criterios/:criterioId/niveles", require("./routes/rubrica_criterio_nivel.routes"));

// =========================
// Catálogos (si los sigues usando en otras pantallas)
// =========================
protectedApi.use("/componentes", require("./routes/componente.routes"));
protectedApi.use("/criterios", require("./routes/criterio.routes"));
protectedApi.use("/niveles", require("./routes/nivel.routes"));

// Otros catálogos agrupados
protectedApi.use("/", require("./routes/catalogos.routes"));

// (Opcional) DEBUG para confirmar scope
protectedApi.get("/debug/whoami", (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Montar el router protegido
app.use("/api", protectedApi);

// =========================
// 404 JSON (si no existe la ruta)
// =========================
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

// =========================
// Error handler GLOBAL (para ver el error real)
// =========================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  const status = err.status || 500;

  res.status(status).json({
    ok: false,
    message: err.message || "Internal Server Error",
    stack: err.stack,
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
