// src/components/layout/Sidebar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { clearSession, getActiveRole } from "../../utils/auth";
import { MENU_SECTIONS } from "./menuByRole";
import type { IconName } from "./menuByRole";

function roleLabel(role: number | null) {
  switch (role) {
    case 1:
      return "Súper Administrador";
    case 2:
      return "Director / Apoyo";
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
      return "Gestión académica (carrera)";
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
      return "DC";
    case 3:
      return "DO";
    default:
      return "U";
  }
}

function MenuIcon({ name }: { name: IconName }) {
  // SVGs monocromos (usan currentColor)
  switch (name) {
    case "principal":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5Z" />
        </svg>
      );

    case "perfil":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Zm0 2.2c-4.2 0-7.6 2.2-7.6 4.9V21h15.2v-1.9c0-2.7-3.4-4.9-7.6-4.9Z" />
        </svg>
      );

    case "carreras":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 1.8 8.3 12 13.5l10.2-5.2L12 3Zm-7 8.2V16c0 2.2 3.1 4 7 4s7-1.8 7-4v-4.8l-7 3.6-7-3.6Z" />
        </svg>
      );

    case "periodos":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 8H5v10h14V10Z" />
        </svg>
      );

    case "rubricas":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 2h9l3 3v17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5L14 3.5ZM7 10h8v2H7v-2Zm0 4h8v2H7v-2Zm0 4h6v2H7v-2Z" />
        </svg>
      );

    case "docentes":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4Zm0 2c-4.4 0-8 2.3-8 5.2V21h16v-1.8C20 16.3 16.4 14 12 14Z" />
        </svg>
      );

    case "estudiantes":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4Zm8 9v-1.7c0-2.4-3.2-4.3-7.2-4.3h-1.6C7.2 14.999 4 16.9 4 19.3V21h16Z" />
        </svg>
      );

    case "tribunales":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6l-8-4Zm-2 14-3-3 1.4-1.4L10 13.2l5.6-5.6L17 9l-7 7Z" />
        </svg>
      );

    case "acta":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 2h9l3 3v17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5L14 3.5ZM7 11h10v2H7v-2Zm0 4h10v2H7v-2Z" />
        </svg>
      );

    /* ==========================
       ✅ NUEVOS ÍCONOS ROL 2
       (simples y monocromos)
       ========================== */

    // Casos de estudio: documento + lupa
    case "casosEstudio":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 2h9l3 3v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5L14 3.5Z" />
          <path d="M7 10h8v2H7v-2Zm0 4h6v2H7v-2Z" />
        </svg>
      );

    // Entregas de caso: flecha/subida
    case "entregasCaso":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l5 5h-3v6h-4V8H7l5-5Z" />
          <path d="M5 19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4h-2v4H7v-4H5v4Z" />
        </svg>
      );

    // Plan de evaluación: clipboard/checklist
    case "planEvaluacion":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 2h6a2 2 0 0 1 2 2v1h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2Zm6 3V4H9v1h6Z" />
          <path d="M7 10h10v2H7v-2Zm0 4h10v2H7v-2Z" />
        </svg>
      );

    // Calificadores generales: estrella/medalla
    case "calificadores":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.4 8.3l6-.9L12 2Z" />
        </svg>
      );

    // Nota teórico: libro
    case "notaTeorico":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3h10a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2V5a2 2 0 0 1 2-2Zm0 4h12v2H6V7Zm0 4h12v2H6v-2Z" />
        </svg>
      );

    // Ponderaciones: %
    case "ponderaciones":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 17a2 2 0 1 0 0-4a2 2 0 0 0 0 4Zm10-6a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z" />
          <path d="M7 19 17 5h2L9 19H7Z" />
        </svg>
      );

    default:
      return null;
  }
}

export default function Sidebar({
  isOpen,
  pinned,
  onTogglePinned,
  onClose,
}: {
  isOpen: boolean;
  pinned: boolean;
  onTogglePinned: () => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const role = getActiveRole();

  const sections = (() => {
    if (!role) return [];
    const seen = new Set<string>();

    return MENU_SECTIONS
      .filter((sec) => sec.roles.includes(role))
      .map((sec) => {
        const items = sec.items.filter((it) => {
          if (!it.roles.includes(role)) return false;
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
      {isOpen && !pinned && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "open" : ""} ${pinned ? "pinned" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-badge">{avatarText(role)}</div>

          <div>
            <div className="sidebar-title">Menú</div>
            <div className="sidebar-subtitle">{role ? roleLabel(role) : "—"}</div>
          </div>

          <button
            type="button"
            className={`sidebar-pin ${pinned ? "on" : ""}`}
            onClick={onTogglePinned}
            aria-label={pinned ? "Desanclar menú" : "Anclar menú"}
            title={pinned ? "Desanclar" : "Anclar"}
          >
            <svg viewBox="0 0 24 24" className="sidebar-pin-ico">
              <path d="M14 3c.55 0 1 .45 1 1v2.5l2.2 2.2c.2.2.3.45.3.7V12h-5v3.2l1.6 1.6V18h-4v-1.2l1.6-1.6V12H6.3V9.4c0-.25.1-.5.3-.7L8.8 6.5V4c0-.55.45-1 1-1h4Z" />
            </svg>
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
                      className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                      onClick={() => {
                        if (!pinned) onClose();
                      }}
                      end
                    >
                      <span className="sidebar-ico">
                        <MenuIcon name={it.icon} />
                      </span>
                      <span className="sidebar-text">{it.label}</span>
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
