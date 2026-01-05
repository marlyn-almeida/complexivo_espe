import RoleSwitcher from "../auth/RoleSwitcher";
import { getActiveRole } from "../../utils/auth";
import "./Topbar.css";

function roleLabel(role: number | null) {
  switch (role) {
    case 1:
      return "Súper Administrador · Global";
    case 2:
      return "Administrador · Carrera";
    case 3:
      return "Docente · Tribunal";
    default:
      return "Perfil";
  }
}

function roleAvatar(role: number | null) {
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

export default function Topbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const activeRole = getActiveRole();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-burger"
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="topbar-brand">
          <div className="topbar-title">Examen Complexivo</div>
          <div className="topbar-subtitle">
            Universidad de las Fuerzas Armadas ESPE 
          </div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Selector de rol */}
        <RoleSwitcher />

        <div className="topbar-user">
          <div className="topbar-user-name">Perfil actual</div>
          <div className="topbar-user-desc">{roleLabel(activeRole)}</div>
        </div>

        <div className="topbar-avatar">{roleAvatar(activeRole)}</div>
      </div>
    </header>
  );
}
