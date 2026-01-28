import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleSwitcher from "../auth/RoleSwitcher";
import { clearSession, getActiveRole } from "../../utils/auth";
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
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goProfile = () => {
  setOpen(false);
  navigate("/perfil"); 
};


  const logout = () => {
    clearSession();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbarLeft">
        <button
          className="topbarBurger"
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="topbarBrand">
          <div className="topbarTitle">Examen Complexivo</div>
          <div className="topbarSubtitle">
            Universidad de las Fuerzas Armadas ESPE
          </div>
        </div>
      </div>

      <div className="topbarRight">
        <RoleSwitcher />

        <div className="topbarUser">
          <div className="topbarUserName">Perfil actual</div>
          <div className="topbarUserDesc">{roleLabel(activeRole)}</div>
        </div>

        <div className="topbarMenu" ref={menuRef}>
          <button
            type="button"
            className="topbarAvatarBtn"
            onClick={() => setOpen((p) => !p)}
            aria-label="Abrir opciones de perfil"
            aria-expanded={open}
          >
            <div className="topbarAvatar">{roleAvatar(activeRole)}</div>
            <span className="topbarChevron">▾</span>
          </button>

          {open && (
            <div className="topbarDropdown" role="menu">
              <div className="ddHeader">
                <div className="ddSmall">Sesión iniciada como</div>
                <div className="ddUser">Super Admin</div>
              </div>

              <button className="ddItem" onClick={goProfile} role="menuitem">
                <span className="material-symbols-outlined ddIcon" aria-hidden="true">
                  person
                </span>
                Mi perfil
              </button>

              <button className="ddItem danger" onClick={logout} role="menuitem">
                <span className="material-symbols-outlined ddIcon" aria-hidden="true">
                  logout
                </span>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
