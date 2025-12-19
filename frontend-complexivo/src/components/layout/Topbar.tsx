import "./Topbar.css";

export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-burger" onClick={onToggleSidebar} aria-label="Abrir menú">
          <span />
          <span />
          <span />
        </button>

        <div className="topbar-brand">
          <div className="topbar-title">Examen Complexivo</div>
          <div className="topbar-subtitle">Universidad de las Fuerzas Armadas ESPE · TI en línea</div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-user">
          <div className="topbar-user-name">Perfil actual</div>
          <div className="topbar-user-desc">Súper Admin · Global</div>
        </div>

        <div className="topbar-avatar">SA</div>
      </div>
    </header>
  );
}
