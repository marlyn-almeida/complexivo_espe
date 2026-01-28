import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardPortal.css";

import logo from "../../assets/escudo.png";

export type DashItem = {
  label: string;
  to: string;
  icon: "carreras" | "periodos" | "carrera_periodo" | "rubricas" | "docentes";
};

type DashboardBaseProps = {
  items: DashItem[];
  role?: "SUPER_ADMIN" | "DIRECTOR" | "DOCENTE";
};

type StatTone = "neutral" | "success" | "info" | "warn";

type StatCard = {
  value: number | string;
  label: string;
  tone: StatTone;
};

function Icon({
  name,
}: {
  name: DashItem["icon"] | "stats" | "shield" | "close";
}) {
  switch (name) {
    case "carreras":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M12 3 1 8l11 5 9-4.09V17h2V8L12 3zm0 12L4 11v6c0 2.76 3.58 5 8 5s8-2.24 8-5v-6l-8 4z"
            fill="currentColor"
          />
        </svg>
      );
    case "periodos":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm13 6H6v12h14V8z"
            fill="currentColor"
          />
        </svg>
      );
    case "carrera_periodo":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M12 2a5 5 0 0 1 5 5v1h2a3 3 0 0 1 3 3v2h-3v-2h-2v2a5 5 0 0 1-5 5H9v2h2v3H2v-3h2v-4a7 7 0 0 1 7-7h4V7a3 3 0 0 0-3-3H9V2h3z"
            fill="currentColor"
          />
        </svg>
      );
    case "rubricas":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16h16V8l-6-6zm1 7V3.5L18.5 9H15zM7 13h10v2H7v-2zm0 4h10v2H7v-2z"
            fill="currentColor"
          />
        </svg>
      );
    case "docentes":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"
            fill="currentColor"
          />
        </svg>
      );
    case "stats":
      return (
        <svg viewBox="0 0 24 24" className="portalSvgSm" aria-hidden="true">
          <path
            d="M3 3h2v18H3V3zm4 10h2v8H7v-8zm4-6h2v14h-2V7zm4 4h2v10h-2V11zm4-8h2v18h-2V3z"
            fill="currentColor"
          />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" className="portalSvgSm" aria-hidden="true">
          <path
            d="M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm-1 6h2v8h-2V8zm0 10h2v2h-2v-2z"
            fill="currentColor"
          />
        </svg>
      );
    case "close":
      return (
        <svg viewBox="0 0 24 24" className="portalSvgSm" aria-hidden="true">
          <path
            d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.6l6.3-6.31 1.41 1.42z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function DashboardBase({
  items,
  role = "SUPER_ADMIN",
}: DashboardBaseProps) {
  const navigate = useNavigate();
  const [showSecurityTip, setShowSecurityTip] = useState(true);

  const stats: StatCard[] = useMemo(
    () => [
      { value: 0, label: "Docentes", tone: "neutral" },
      { value: 0, label: "Carreras", tone: "success" },
      { value: 0, label: "Períodos", tone: "info" },
      { value: 0, label: "Rúbricas", tone: "warn" },
    ],
    []
  );

  return (
    <div className={`portalWrap portal--${role.toLowerCase()}`}>
      {/* Banner institucional */}
      <section className="portalHero" aria-label="Encabezado del sistema">
        <img src={logo} alt="ESPE" className="portalHeroLogo" />
        <div className="portalHeroText">
          <h1 className="portalHeroTitle">
            SISTEMA DE GESTIÓN DE EXÁMENES COMPLEXIVOS
          </h1>
          <p className="portalHeroSubtitle">
            Gestión integral de tribunales y evaluaciones
          </p>
        </div>
      </section>

      {/* Recomendación seguridad (más grande) */}
      {showSecurityTip && (
        <section className="portalAlert portalAlert--big" aria-label="Recomendación de seguridad">
          <div className="portalAlertLeft">
            <span className="portalAlertIcon" aria-hidden="true">
              <Icon name="shield" />
            </span>

            <div className="portalAlertText">
              <b>Recomendación de seguridad:</b> Por tu seguridad, te
              recomendamos cambiar tu contraseña periódicamente.{" "}
              <button
                type="button"
                className="portalAlertLink"
                onClick={() => navigate("/perfil")}

              >
                Ir a mi perfil
              </button>
            </div>
          </div>

          <button
            type="button"
            className="portalAlertClose"
            aria-label="Cerrar"
            onClick={() => setShowSecurityTip(false)}
          >
            <Icon name="close" />
          </button>
        </section>
      )}

      {/* 1) Accesos rápidos en su caja */}
      <section className="portalBox" aria-label="Accesos rápidos">
        <div className="portalBoxHead">
          <h2 className="portalSectionTitle">Accesos rápidos</h2>
        </div>

        <div className="portalGrid">
          {items.map((it) => (
            <button
              key={it.to}
              type="button"
              className={`portalTile portalTile--${it.icon}`}
              onClick={() => navigate(it.to)}
              aria-label={`Ir a ${it.label}`}
            >
              <div className="portalIconBox" aria-hidden="true">
                <Icon name={it.icon} />
              </div>
              <div className="portalLabel">{it.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 2) Estadísticas en otra caja */}
      <section className="portalBox" aria-label="Estadísticas del sistema">
        <div className="portalStatsHead">
          <div className="portalStatsTitle">
            <span className="portalStatsTitleIcon" aria-hidden="true">
              <Icon name="stats" />
            </span>
            Estadísticas del Sistema
          </div>
        </div>

        <div className="portalStatsGrid">
          {stats.map((s) => (
            <div key={s.label} className={`portalStat portalStat--${s.tone}`}>
              <div className="portalStatValue">{s.value}</div>
              <div className="portalStatLabel">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
