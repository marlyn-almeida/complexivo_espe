import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Login from "../pages/auth/Login";
import DashboardAdmin from "../pages/dashboard/DashboardAdmin";
import PeriodosPage from "../pages/periodos/PeriodosPage";
import CarrerasPage from "../pages/carreras/CarrerasPage";
import DocentesPage from "../pages/docentes/DocentesPage";
import EstudiantesPage from "../pages/estudiantes/EstudiantesPage";
import CarreraPeriodoPage from "../pages/carreraPeriodo/CarreraPeriodoPage";
//import RolesPage from "../pages/roles/RolesPage"; // si ya la tienes, si no, déjala placeholder solo aquí

const Placeholder = ({ title }: { title: string }) => (
  <div className="rounded-lg bg-white p-4 shadow-espeSoft">{title}</div>
);

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardAdmin />} />

          <Route path="/periodos" element={<PeriodosPage />} />
          <Route path="/carreras" element={<CarrerasPage />} />
          <Route path="/docentes" element={<DocentesPage />} />
          <Route path="/estudiantes" element={<EstudiantesPage />} />
          <Route path="/carrera-periodo" element={<CarreraPeriodoPage />} />

          {/* Solo deja placeholder para lo que NO tengas page real */}
          <Route path="/roles" element={<Placeholder title="Roles (CRUD siguiente)" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
