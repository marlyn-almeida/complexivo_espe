// src/pages/dashboard/DashboardBase.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardPortal.css";

import logo from "../../assets/escudo.png";

/* =========================
   TIPOS
   ========================= */

export type DashIcon =
  | "carreras"
  | "periodos"
  | "carrera_periodo"
  | "rubricas"
  | "docentes"
  // ✅ ROL 2
  | "estudiantes"
  | "tribunales"
  | "casosEstudio"
  | "franjas"
  // ✅ opcional
  | "acta"
  // ✅ NUEVO (para dashboards)
  | "perfil";

export type DashItem = {
  label: string;
  to: string;
  icon: DashIcon;
};

export type StatTone = "neutral" | "success" | "info" | "warn";

export type StatCard = {
  value: number | string;
  label: string;
  tone: StatTone;
};

type DashboardBaseProps = {
  items: DashItem[];
  role?: "SUPER_ADMIN" | "DIRECTOR" | "DOCENTE";
  stats?: StatCard[]; // ✅ ahora se pasan desde cada dashboard
};

/* =========================
   ICONOS
   ========================= */

function Icon({ name }: { name: DashIcon | "stats" | "shield" | "close" }) {
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

    /* =========================
       ✅ ICONOS ROL 2
       ========================= */

    case "estudiantes":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm8 9v-1.7c0-2.4-3.2-4.3-7.2-4.3h-1.6C7.2 15 4 16.9 4 19.3V21h16z"
            fill="currentColor"
          />
        </svg>
      );

    case "tribunales":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6l-8-4Zm-2 14-3-3 1.4-1.4L10 13.2l5.6-5.6L17 9l-7 7Z"
            fill="currentColor"
          />
        </svg>
      );

    case "casosEstudio":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M6 2h9l3 3v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5L14 3.5Z"
            fill="currentColor"
          />
          <path
            d="M7 10h8v2H7v-2Zm0 4h6v2H7v-2Z"
            fill="currentColor"
          />
        </svg>
      );

    case "franjas":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 11h5v-2h-4V7h-2v6Z"
            fill="currentColor"
          />
        </svg>
      );

    case "acta":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M6 2h9l3 3v17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5L14 3.5ZM7 11h10v2H7v-2Zm0 4h10v2H7v-2Z"
            fill="currentColor"
          />
        </svg>
      );

    /* ✅ NUEVO: PERFIL */
    case "perfil":
      return (
        <svg viewBox="0 0 24 24" className="portalSvg" aria-hidden="true">
          <path
            d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Zm0 2.2c-4.2 0-7.6 2.2-7.6 4.9V21h15.2v-1.9c0-2.7-3.4-4.9-7.6-4.9Z"
            fill="currentColor"
          />
        </svg>
      );

    /* =========================
       UI: stats / seguridad / cerrar
       ========================= */

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

/* =========================
   COMPONENTE
   ========================= */

export default function DashboardBase({
  items,
  role = "SUPER_ADMIN",
  stats,
}: DashboardBaseProps) {
  const navigate = useNavigate();
  const [showSecurityTip, setShowSecurityTip] = useState(true);

  // ✅ SOLO mostramos estadísticas si:
  // - SUPER_ADMIN: siempre (si no hay stats, muestra placeholders)
  // - DIRECTOR / DOCENTE: solo si explícitamente se pasan stats
  const finalStats: StatCard[] | null = useMemo(() => {
    if (role === "SUPER_ADMIN") {
      return (
        stats ?? [
          { value: "—", label: "Indicador 1", tone: "neutral" },
          { value: "—", label: "Indicador 2", tone: "success" },
          { value: "—", label: "Indicador 3", tone: "info" },
          { value: "—", label: "Indicador 4", tone: "warn" },
        ]
      );
    }
    return stats ?? null;
  }, [role, stats]);

  return (
    <div className={`portalWrap portal--${role.toLowerCase()}`}>
      {/* Banner institucional */}
      <section className="portalHero" aria-label="Encabezado del sistema">
        <img src={logo} alt="ESPE" className="portalHeroLogo" />
        <div className="portalHeroText">
          <h1 className="portalHeroTitle">SISTEMA DE GESTIÓN DE EXÁMENES COMPLEXIVOS</h1>
          <p className="portalHeroSubtitle">Gestión integral de tribunales y evaluaciones</p>
        </div>
      </section>

      {/* Recomendación seguridad */}
      {showSecurityTip && (
        <section className="portalAlert portalAlert--big" aria-label="Recomendación de seguridad">
          <div className="portalAlertLeft">
            <span className="portalAlertIcon" aria-hidden="true">
              <Icon name="shield" />
            </span>

            <div className="portalAlertText">
              <b>Recomendación de seguridad:</b> Por tu seguridad, te recomendamos cambiar tu
              contraseña periódicamente.{" "}
              <button type="button" className="portalAlertLink" onClick={() => navigate("/perfil")}>
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

      {/* Accesos rápidos */}
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

      {/* ✅ Estadísticas (solo cuando corresponda) */}
      {finalStats && (
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
            {finalStats.map((s) => (
              <div key={s.label} className={`portalStat portalStat--${s.tone}`}>
                <div className="portalStatValue">{s.value}</div>
                <div className="portalStatLabel">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
