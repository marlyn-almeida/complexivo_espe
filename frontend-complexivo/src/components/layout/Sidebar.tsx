import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { clearSession, getActiveRole } from "../../utils/auth";
import { MENU_SECTIONS } from "./menuByRole";

function roleLabel(role: number | null) {
  switch (role) {
    case 1:
      return "Súper Administrador";
    case 2:
      return "Administrador";
    case 3:
      return "Docente";
    default:
      return "Usuario";
  }
}

function roleDesc(role: number | null) {
  switch (role) {
    case 1:
      return "Gestión global";
    case 2:
      return "Gestión por carrera";
    case 3:
      return "Tribunales y calificación";
    default:
      return "";
  }
}

function avatarText(role: number | null) {
  switch (role) {
    case 1:
      return "SA";
    case 2:
      return "AD";
    case 3:
      return "DO";
    default:
      return "U";
  }
}

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const role = getActiveRole();

  // ✅ Secciones dinámicas + dedupe de rutas por "to"
  const sections = (() => {
    if (!role) return [];
    const seen = new Set<string>();

    return MENU_SECTIONS
      .filter((sec) => sec.roles.includes(role))
      .map((sec) => {
        const items = sec.items.filter((it) => {
          if (!it.roles.includes(role)) return false;

          // dedupe por ruta
          if (seen.has(it.to)) return false;
          seen.add(it.to);

          return true;
        });

        return { ...sec, items };
      })
      .filter((sec) => sec.items.length > 0);
  })();

  const handleLogout = () => {
    clearSession();
    onClose();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-badge">{avatarText(role)}</div>

          <div>
            <div className="sidebar-title">Menú</div>
            <div className="sidebar-subtitle">{role ? roleLabel(role) : "—"}</div>
          </div>

          <button className="sidebar-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="sidebar-body">
          <nav className="sidebar-nav">
            {sections.map((sec) => (
              <div key={sec.title} className="sidebar-section">
                <div className="sidebar-section-title">{sec.title}</div>

                <div className="sidebar-section-items">
                  {sec.items.map((it) => (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                      }
                      onClick={onClose}
                    >
                      <span className="sidebar-dot" />
                      {it.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="sidebar-profile">
            <div className="sidebar-profile-card">
              <div className="sidebar-profile-left">
                <div className="sidebar-avatar">{avatarText(role)}</div>

                <div>
                  <div className="sidebar-profile-name">{roleLabel(role)}</div>
                  <div className="sidebar-profile-role">{roleDesc(role)}</div>
                </div>
              </div>
            </div>

            <div className="sidebar-actions">
              <button className="sidebar-btn danger" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
