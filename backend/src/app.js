const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`Servidor activo en http://localhost:${PORT}`)
);
const rolRoutes = require("./routes/rol.routes");
app.use("/api/roles", rolRoutes);

const docenteRoutes = require("./routes/docente.routes");
app.use("/api/docentes", docenteRoutes);

const carreraRoutes = require("./routes/carrera.routes");
app.use("/api/carreras", carreraRoutes);

app.use("/api/periodos", require("./routes/periodo.routes"));
app.use("/api/carreras-periodos", require("./routes/carrera_periodo.routes"));


app.use("/api/estudiantes", require("./routes/estudiante.routes"));

app.use("/api/franjas-horarias", require("./routes/franja_horario.routes"));
app.use("/api/carreras-docentes", require("./routes/carrera_docente.routes"));
app.use("/api/tribunales", require("./routes/tribunal.routes"));

app.use("/api/tribunales-estudiantes", require("./routes/tribunal_estudiante.routes"));
app.use("/api/calificaciones", require("./routes/calificacion.routes"));
app.use("/api/actas", require("./routes/acta.routes"));

app.use("/api/rubricas", require("./routes/rubrica.routes"));
app.use("/api/componentes", require("./routes/componente.routes"));
app.use("/api/criterios", require("./routes/criterio.routes"));
app.use("/api/niveles", require("./routes/nivel.routes"));

app.use("/api/rubricas-componentes", require("./routes/rubrica_componente.routes"));
app.use("/api/rubricas-criterios-niveles", require("./routes/rubrica_criterio_nivel.routes"));
