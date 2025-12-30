const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// =========================
// Rutas del sistema
// =========================
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/roles", require("./routes/rol.routes"));
app.use("/api/docentes", require("./routes/docente.routes"));
app.use("/api/carreras", require("./routes/carrera.routes"));
app.use("/api/departamentos", require("./routes/departamento.routes"));

app.use("/api/periodos", require("./routes/periodo.routes"));
app.use("/api/carreras-periodos", require("./routes/carrera_periodo.routes"));
app.use("/api/estudiantes", require("./routes/estudiante.routes"));

app.use("/api/franjas-horarias", require("./routes/franja_horario.routes"));
app.use("/api/carreras-docentes", require("./routes/carrera_docente.routes"));
app.use("/api/tribunales", require("./routes/tribunal.routes"));
app.use("/api/tribunales-estudiantes", require("./routes/tribunal_estudiante.routes"));

app.use("/api/calificaciones", require("./routes/calificacion.routes"));
app.use("/api/actas", require("./routes/acta.routes"));
app.use("/api", require("./routes/catalogos.routes"));

// =========================
// Catálogos (si los sigues usando en otras pantallas)
// =========================
app.use("/api/componentes", require("./routes/componente.routes"));
app.use("/api/criterios", require("./routes/criterio.routes"));
app.use("/api/niveles", require("./routes/nivel.routes"));

// =========================
// RÚBRICAS (nuevo flujo: 1 rubrica por período)
// =========================
app.use("/api/rubricas", require("./routes/rubrica.routes"));

// Niveles dentro de una rúbrica (rubrica_nivel)
app.use("/api/rubricas/:rubricaId/niveles", require("./routes/rubrica_nivel.routes"));

// Componentes dentro de una rúbrica (rubrica_componente)
app.use("/api/rubricas/:rubricaId/componentes", require("./routes/rubrica_componente.routes"));

// Criterios dentro de un componente (rubrica_criterio)
app.use("/api/componentes/:componenteId/criterios", require("./routes/rubrica_criterio.routes"));

// Descripciones por nivel dentro de un criterio (rubrica_criterio_nivel)
app.use("/api/criterios/:criterioId/niveles", require("./routes/rubrica_criterio_nivel.routes"));

// Health check (para Render)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API funcionando" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
