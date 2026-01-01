import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Login from "../pages/auth/Login";
import ChangePasswordPage from "../pages/auth/ChangePasswordPage";

import DashboardSuperAdmin from "../pages/dashboard/DashboardSuperAdmin";
import DashboardAdmin from "../pages/dashboard/DashboardAdmin";

import PeriodosPage from "../pages/periodos/PeriodosPage";
import CarrerasPage from "../pages/carreras/CarrerasPage";
import CarreraAdminsPage from "../pages/carreras/CarreraAdminsPage"; // ✅ NUEVO
import DocentesPage from "../pages/docentes/DocentesPage";
import EstudiantesPage from "../pages/estudiantes/EstudiantesPage";
import CarreraPeriodoPage from "../pages/carreraPeriodo/CarreraPeriodoPage";

// ✅ Rúbricas (solo estas 3 se usan)
import RubricasPeriodoPage from "../pages/rubrica/RubricasPeriodoPage";
import RubricasVerPage from "../pages/rubrica/RubricasVerPage";
import RubricaEditorPage from "../pages/rubrica/RubricaEditorPage";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import { dashboardByRole, getActiveRole, getToken } from "../utils/auth";

const Placeholder = ({ title }: { title: string }) => (
  <div className="rounded-lg bg-white p-4 shadow-espeSoft">{title}</div>
);

// Redirige desde "/" al dashboard del rol activo
function HomeRedirect() {
  const token = getToken();
  const role = getActiveRole();
  if (!token || !role) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardByRole(role)} replace />;
}

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
              <ProtectedRoute allowRoles={[1, 2, 3]}>
                <Placeholder title="Dashboard DOCENTE (pendiente)" />
              </ProtectedRoute>
            }
          />

          {/* Perfil (todos) */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute allowRoles={[1, 2, 3]}>
                <Placeholder title="Mi perfil (pendiente)" />
              </ProtectedRoute>
            }
          />

          {/* =========================
              SUPER_ADMIN (1)
             ========================= */}

          {/* Configuración global */}
          <Route
            path="/carreras"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <CarrerasPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ NUEVA VISTA: ASIGNAR AUTORIDADES POR CARRERA */}
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

          {/* ✅ CARRERA - PERIODO */}
          <Route
            path="/carrera-periodo"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <CarreraPeriodoPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ RÚBRICAS (FLUJO NUEVO: 1 rúbrica por período) */}
          <Route
            path="/rubricas"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <RubricasPeriodoPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ Pantalla por período: crea/abre la rúbrica del período */}
          <Route
            path="/rubricas/periodo/:idPeriodo"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <RubricasVerPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ Editor por id_rubrica */}
          <Route
            path="/rubricas/editar/:idRubrica"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <RubricaEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Administración del sistema */}
          <Route
            path="/docentes"
            element={
              <ProtectedRoute allowRoles={[1, 2]}>
                <DocentesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/asignacion-personal"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <Placeholder title="Asignación de personal por carrera (pendiente)" />
              </ProtectedRoute>
            }
          />

          {/* Seguridad */}
          <Route
            path="/roles"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <Placeholder title="Roles (pendiente)" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/permisos"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <Placeholder title="Permisos (pendiente)" />
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
                <Placeholder title="Franjas horarias (pendiente)" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tribunales"
            element={
              <ProtectedRoute allowRoles={[2]}>
                <Placeholder title="Tribunales (pendiente)" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tribunal-docentes"
            element={
              <ProtectedRoute allowRoles={[2]}>
                <Placeholder title="Asignación Docente-Tribunal (pendiente)" />
              </ProtectedRoute>
            }
          />

          {/* ADMIN (2) y DOCENTE (3) */}
          <Route
            path="/actas"
            element={
              <ProtectedRoute allowRoles={[2, 3]}>
                <Placeholder title="Actas (pendiente)" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/calificaciones"
            element={
              <ProtectedRoute allowRoles={[2, 3]}>
                <Placeholder title="Calificaciones (pendiente)" />
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
                <Placeholder title="Mis tribunales (pendiente)" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/calificar"
            element={
              <ProtectedRoute allowRoles={[3]}>
                <Placeholder title="Calificar (pendiente)" />
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
