import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

type Card = {
  section: string;
  title: string;
  text: string;
  stat: string;
  to: string;
  icon: string; // simple (emoji) para no meter librerías
};

export default function DashboardAdmin() {
  const navigate = useNavigate();

  const cards: Card[] = [
    {
      section: "Carreras",
      title: "Gestión de carreras",
      text: "Crea y administra carreras, sede y modalidad.",
      stat: "Endpoint: /carreras",
      to: "/carreras",
      icon: "🎓",
    },
    {
      section: "Períodos",
      title: "Períodos académicos",
      text: "Crea y controla períodos académicos.",
      stat: "Endpoint: /periodos",
      to: "/periodos",
      icon: "📅",
    },
    {
      section: "Docentes",
      title: "Gestión de docentes",
      text: "Registra docentes y habilita su acceso.",
      stat: "Endpoint: /docentes",
      to: "/docentes",
      icon: "👩‍🏫",
    },
    {
      section: "Roles",
      title: "Roles del sistema",
      text: "Administra roles y su estado.",
      stat: "Endpoint: /roles",
      to: "/roles",
      icon: "🛡️",
    },
  ];

  const onOpen = (to: string) => navigate(to);

  return (
    <div className="dashboard-wrap">
      <section className="dashboard-header">
        <div className="dashboard-title-block">
          <h2>Panel del Súper Administrador · Examen Complexivo</h2>
          <p>Configura carreras, períodos, roles, docentes y catálogos del sistema.</p>
        </div>

        <div className="dashboard-header-hint">
          <span className="hint-chip">Tip: haz clic en una tarjeta para ir al módulo</span>
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Módulos del sistema">
        {cards.map((c) => (
          <button
            key={c.to}
            type="button"
            className="dashboard-card"
            onClick={() => onOpen(c.to)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpen(c.to);
            }}
            aria-label={`Ir a ${c.section}`}
          >
            <div className="card-top">
              <div className="card-icon" aria-hidden="true">
                {c.icon}
              </div>

              <div className="card-top-text">
                <div className="dashboard-section-title">{c.section}</div>
                <div className="dashboard-card-title">{c.title}</div>
              </div>

              <div className="card-chevron" aria-hidden="true">
                →
              </div>
            </div>

            <p className="dashboard-card-text">{c.text}</p>

            <div className="card-bottom">
              <span className="dashboard-card-stat">{c.stat}</span>
              <span className="card-badge">Abrir</span>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
