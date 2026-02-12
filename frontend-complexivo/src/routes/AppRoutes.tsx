// ✅ src/routes/AppRoutes.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "../components/layout/Layout";
import Login from "../pages/auth/Login";
import ChangePasswordPage from "../pages/auth/ChangePasswordPage";

import DashboardSuperAdmin from "../pages/dashboard/DashboardSuperAdmin";
import DashboardAdmin from "../pages/dashboard/DashboardAdmin";
import DashboardDocente from "../pages/dashboard/DashboardDocente";

import PeriodosPage from "../pages/periodos/PeriodosPage";
import PeriodoCarrerasPage from "../pages/periodos/PeriodoCarrerasPage";
import CarrerasPage from "../pages/carreras/CarrerasPage";
import CarreraAdminsPage from "../pages/carreras/CarreraAdminsPage";

import DocentesPage from "../pages/docentes/DocentesPage";
import EstudiantesPage from "../pages/estudiantes/EstudiantesPage";
import EstudianteAsignacionesPage from "../pages/estudiantes/EstudianteAsignacionesPage";
import PerfilPage from "../pages/perfil/PerfilPage";

import RubricasPeriodoPage from "../pages/rubrica/RubricasPeriodoPage";
import RubricasVerPage from "../pages/rubrica/RubricasVerPage";
import RubricaEditorPage from "../pages/rubrica/RubricaEditorPage";

import FranjaHorariaPage from "../pages/franja-horaria/FranjaHorariaPage";
import TribunalesPage from "../pages/tribunales/TribunalesPage";

import PlantillasActaWordPage from "../pages/plantillasActa/PlantillasActaWordPage";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import { dashboardByRole, getActiveRole, getToken } from "../utils/auth";

// ROL 2
import CasosEstudioPage from "../pages/casosEstudio/CasosEstudioPage";

// ✅ Pantalla unificada (ADMIN + DOCENTE con role switch)
import MisCalificacionesPage from "../pages/misCalificaciones/MisCalificacionesPage";

// ✅ DOCENTE (3): pantalla real para calificar 1 tribunal_estudiante
import CalificarTribunalPage from "../pages/misCalificaciones/CalificarTribunalPage";

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
        {/* PÚBLICO */}
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* PRIVADO (Layout) */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />

          {/* Dashboards */}
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
              <ProtectedRoute allowRoles={[2]}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/docente/dashboard"
            element={
              <ProtectedRoute allowRoles={[3]}>
                <DashboardDocente />
              </ProtectedRoute>
            }
          />

          {/* Perfil */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute allowRoles={[1, 2, 3]}>
                <PerfilPage />
              </ProtectedRoute>
            }
          />

          {/* SUPER_ADMIN (1) */}
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
            path="/periodos/:id/carreras"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <PeriodoCarrerasPage />
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
            path="/plantillas-acta"
            element={
              <ProtectedRoute allowRoles={[1]}>
                <PlantillasActaWordPage />
              </ProtectedRoute>
            }
          />

          {/* DOCENTES (1 y 2) */}
          <Route
            path="/docentes"
            element={
              <ProtectedRoute allowRoles={[1, 2]}>
                <DocentesPage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN (2) */}
          <Route
            path="/estudiantes"
            element={
              <ProtectedRoute allowRoles={[2]}>
                <EstudiantesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estudiantes/:idEstudiante/asignaciones"
            element={
              <ProtectedRoute allowRoles={[2]}>
                <EstudianteAsignacionesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/casos-estudio"
            element={
              <ProtectedRoute allowRoles={[2]}>
                <CasosEstudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/franjas"
            element={
              <ProtectedRoute allowRoles={[1, 2]}>
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

          {/* ✅ CALIFICACIONES ADMIN (2) */}
          <Route
            path="/calificaciones"
            element={
              <ProtectedRoute allowRoles={[2]}>
                <MisCalificacionesPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ DOCENTE (3) — LISTADO (AGENDA) */}
          {/* 🔥 IMPORTANTE: ahora usa MisCalificacionesPage (para que tenga botón CALIFICAR) */}
          <Route
            path="/docente/calificaciones"
            element={
              <ProtectedRoute allowRoles={[3]}>
                <MisCalificacionesPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ DOCENTE (3) — CALIFICAR 1 TRIBUNAL_ESTUDIANTE */}
          <Route
            path="/docente/calificaciones/:idTribunalEstudiante"
            element={
              <ProtectedRoute allowRoles={[3]}>
                <CalificarTribunalPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ COMPATIBILIDAD: si tu menú aún apunta aquí */}
          <Route
            path="/mis-tribunales"
            element={<Navigate to="/docente/calificaciones" replace />}
          />

          {/* ACTAS */}
          <Route
            path="/admin/actas"
            element={
              <ProtectedRoute allowRoles={[2]}>
                <Placeholder title="Actas (ADMIN) — pendiente de pantalla" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/actas"
            element={
              <ProtectedRoute allowRoles={[3]}>
                <Placeholder title="Actas (DOCENTE) — No existen actas para este tribunal" />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* cualquier otra */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
