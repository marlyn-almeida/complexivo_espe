import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-badge">EC</div>
          <div>
            <div className="sidebar-title">Examen Complexivo</div>
            <div className="sidebar-subtitle">ESPE · TI en línea</div>
          </div>
        </div>

        <div className="sidebar-body">
          <div className="sidebar-section-title">Súper Admin</div>

          <nav className="sidebar-nav">
            <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-dot" />
              Dashboard
            </NavLink>

            <NavLink to="/carreras" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-dot" />
              Carreras
            </NavLink>

            <NavLink to="/periodos" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-dot" />
              Períodos
            </NavLink>

            <NavLink to="/docentes" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-dot" />
              Docentes
            </NavLink>

            <NavLink to="/roles" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-dot" />
              Roles
            </NavLink>

            <NavLink to="/carrera-periodo" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-dot" />
              Carrera–Período
            </NavLink>

            <NavLink to="/estudiantes" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-dot" />
              Estudiantes
            </NavLink>
          </nav>

          <div className="sidebar-profile">
            <div className="sidebar-profile-card">
              <div className="sidebar-profile-left">
                <div className="sidebar-avatar">SA</div>
                <div>
                  <div className="sidebar-profile-name">Súper Admin</div>
                  <div className="sidebar-profile-role">Global</div>
                </div>
              </div>
            </div>

            <div className="sidebar-actions">
              <button className="sidebar-btn" type="button">Mi perfil</button>
              <button className="sidebar-btn danger" type="button">Cerrar sesión</button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
