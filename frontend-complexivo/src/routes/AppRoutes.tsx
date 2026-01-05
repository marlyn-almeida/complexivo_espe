import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Login from "../pages/auth/Login";
import ChangePasswordPage from "../pages/auth/ChangePasswordPage";

import DashboardSuperAdmin from "../pages/dashboard/DashboardSuperAdmin";
import DashboardAdmin from "../pages/dashboard/DashboardAdmin";

import PeriodosPage from "../pages/periodos/PeriodosPage";
import CarrerasPage from "../pages/carreras/CarrerasPage";
import CarreraAdminsPage from "../pages/carreras/CarreraAdminsPage";
import DocentesPage from "../pages/docentes/DocentesPage";
import EstudiantesPage from "../pages/estudiantes/EstudiantesPage";
import CarreraPeriodoPage from "../pages/carreraPeriodo/CarreraPeriodoPage";

import PerfilPage from "../pages/perfil/PerfilPage";

import RubricasPeriodoPage from "../pages/rubrica/RubricasPeriodoPage";
import RubricasVerPage from "../pages/rubrica/RubricasVerPage";
import RubricaEditorPage from "../pages/rubrica/RubricaEditorPage";

import FranjaHorariaPage from "../pages/franja-horaria/FranjaHorariaPage";
import TribunalesPage from "../pages/tribunales/TribunalesPage";

// ✅ NUEVO: Mis tribunales (Docente)
import MisTribunalesPage from "../pages/docentes/MisTribunalesPage";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import { dashboardByRole, getActiveRole, getToken } from "../utils/auth";

// Redirige desde "/" al dashboard del rol activo
function HomeRedirect() {
  const token = getToken();
  const role = getActiveRole();
  if (!token || !role) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardByRole(role)} replace />;
}

const Placeholder = ({ title }: { title: string }) => (
  <div className="rounded-lg bg-white p-4 shadow-espeSoft">{title}</div>
);

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Privado (Layout) */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />

          {/* Dashboards por rol */}
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <DashboardSuperAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowRoles={[1, 2]}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/docente/dashboard"
            element={
              <ProtectedRoute allowRoles={[3]}>
                <Placeholder title="Dashboard DOCENTE (pendiente)" />
              </ProtectedRoute>
            }
          />

          {/* Perfil (todos) */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute allowRoles={[1, 2, 3]}>
                <PerfilPage />
              </ProtectedRoute>
            }
          />

          {/* =========================
              SUPER_ADMIN (1)
             ========================= */}
          <Route
            path="/carreras"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <CarrerasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/carreras/:id/admin"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <CarreraAdminsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/periodos"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <PeriodosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/carrera-periodo"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <CarreraPeriodoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rubricas"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <RubricasPeriodoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rubricas/periodo/:idPeriodo"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <RubricasVerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rubricas/editar/:idRubrica"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <RubricaEditorPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/docentes"
            element={
              <ProtectedRoute allowRoles={[1, 2]}>
                <DocentesPage />
              </ProtectedRoute>
            }
          />

          {/* =========================
              ADMIN (2)
             ========================= */}
          <Route
            path="/estudiantes"
            element={
              <ProtectedRoute allowRoles={[2]}>
                <EstudiantesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/franjas"
            element={
              <ProtectedRoute allowRoles={[2]}>
                <FranjaHorariaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tribunales"
            element={
              <ProtectedRoute allowRoles={[2]}>
                <TribunalesPage />
              </ProtectedRoute>
            }
          />

          {/* =========================
              DOCENTE (3)
             ========================= */}
          <Route
            path="/mis-tribunales"
            element={
              <ProtectedRoute allowRoles={[3]}>
                <MisTribunalesPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ Ya no necesitamos estas pantallas separadas */}
          {/* <Route path="/mi-agenda" ... /> */}
          {/* <Route path="/calificar" ... /> */}

          <Route
            path="/actas"
            element={
              <ProtectedRoute allowRoles={[3]}>
                <Placeholder title="Actas (pendiente)" />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* cualquier otra ruta */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
