// src/pages/dashboard/DashboardSuperAdmin.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

import {
  GraduationCap,
  CalendarDays,
  ClipboardList,
  User,
  FileText,
  BarChart3,
  Shield,
  X,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./DashboardSuperAdmin.css";

// Services
import { carrerasService } from "../../services/carreras.service";
import { periodosService } from "../../services/periodos.service";
import { docentesService } from "../../services/docentes.service";

type PeriodoResumen = {
  id_periodo: number;
  codigo_periodo: string;
  total_asignadas: number;
};

export default function DashboardSuperAdmin() {
  const navigate = useNavigate();

  const [showAlert, setShowAlert] = useState(true);

  const [loading, setLoading] = useState(false);

  const [carrerasActivas, setCarrerasActivas] = useState(0);
  const [periodosActivos, setPeriodosActivos] = useState(0);
  const [docentesActivos, setDocentesActivos] = useState(0);
  const [plantillasActivas, setPlantillasActivas] = useState(0);

  // ✅ “Rúbricas” en tu UI actual se habilita por períodos con carreras asignadas
  const [periodosConCarreras, setPeriodosConCarreras] = useState(0);

  async function loadMetrics() {
    setLoading(true);
    try {
      const [car, per, doc, plant, resumen] = await Promise.all([
        carrerasService.list(true), // includeInactive = true (para contar activos)
        periodosService.list({ includeInactive: true }),
        docentesService.list({ includeInactive: true }),
        axiosClient.get("/plantillas-acta"),
        axiosClient.get("/carreras-periodos/resumen", { params: { includeInactive: true } }),
      ]);

      // Carreras activas (estado 1)
      const carAct = (car ?? []).filter((x: any) => Number(x.estado) === 1).length;
      setCarrerasActivas(carAct);

      // Periodos activos (estado boolean/number)
      const perAct = (per ?? []).filter((x: any) => {
        const e = x?.estado;
        if (typeof e === "boolean") return e;
        return Number(e) === 1;
      }).length;
      setPeriodosActivos(perAct);

      // Docentes activos (estado 1)
      const docAct = (doc ?? []).filter((x: any) => Number(x.estado) === 1).length;
      setDocentesActivos(docAct);

      // Plantillas activas (estadoActiva === "ACTIVA")
      const listPlant = (plant?.data?.data ?? []) as any[];
      const plaAct = listPlant.filter((x) => String(x?.estadoActiva).toUpperCase() === "ACTIVA").length;
      setPlantillasActivas(plaAct);

      // Periodos con carreras asignadas (total_asignadas > 0)
      const rows = (resumen?.data ?? []) as PeriodoResumen[];
      const conCarr = (rows ?? []).filter((r) => Number(r.total_asignadas || 0) > 0).length;
      setPeriodosConCarreras(conCarr);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tiles = useMemo(
    () => [
      {
        label: "Carreras",
        icon: GraduationCap,
        className: "portalTile portalTile--carreras",
        onClick: () => navigate("/carreras"),
      },
      {
        label: "Períodos",
        icon: CalendarDays,
        className: "portalTile portalTile--periodos",
        onClick: () => navigate("/periodos"),
      },
      {
        label: "Rúbricas",
        icon: ClipboardList,
        className: "portalTile portalTile--rubricas",
        onClick: () => navigate("/rubricas"),
      },
      {
        label: "Docentes",
        icon: User,
        className: "portalTile portalTile--docentes",
        onClick: () => navigate("/docentes"),
      },
      {
        label: "Plantillas Acta Word",
        icon: FileText,
        className: "portalTile portalTile--plantillas",
        onClick: () => navigate("/plantillas-acta-word"),
      },
    ],
    [navigate]
  );

  return (
    <div className="portalWrap">
      <div className="portalContainer">
        {/* HERO */}
        <div className="portalHero">
          <img className="portalHeroLogo" src={escudoESPE} alt="ESPE" />
          <div className="portalHeroText">
            <h1 className="portalHeroTitle">SISTEMA DE GESTIÓN DE EXÁMENES COMPLEXIVOS</h1>
            <p className="portalHeroSubtitle">Gestión integral de tribunales y evaluaciones</p>
          </div>
        </div>

        {/* ALERTA */}
        {showAlert && (
          <div className="portalAlert">
            <div className="portalAlertLeft">
              <div className="portalAlertIcon">
                <Shield size={18} />
              </div>
              <div className="portalAlertText">
                <b>Recomendación de seguridad:</b> Por tu seguridad, te recomendamos cambiar tu contraseña periódicamente.{" "}
                <button className="portalAlertLink" onClick={() => navigate("/perfil")} type="button">
                  Ir a mi perfil
                </button>
              </div>
            </div>

            <button className="portalAlertClose" onClick={() => setShowAlert(false)} aria-label="Cerrar" type="button">
              <X size={18} />
            </button>
          </div>
        )}

        {/* ACCESOS RÁPIDOS */}
        <div className="portalBox">
          <div className="portalBoxHead">
            <h2 className="portalSectionTitle">Accesos rápidos</h2>
          </div>

          <div className="portalGrid">
            {tiles.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.label} className={t.className} onClick={t.onClick} type="button">
                  <div className="portalIconBox">
                    <Icon className="portalSvg" />
                  </div>
                  <div className="portalLabel">{t.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        <div className="portalBox">
          <div className="portalStatsHead">
            <div className="portalStatsTitle">
              <span className="portalStatsTitleIcon">
                <BarChart3 className="portalSvgSm" />
              </span>
              Estadísticas del Sistema {loading ? " (cargando...)" : ""}
            </div>
          </div>

          {/* ✅ 5 en una fila */}
          <div className="portalStatsGrid">
            <div className="portalStat portalStat--success">
              <div className="portalStatValue">{carrerasActivas}</div>
              <div className="portalStatLabel">Carreras activas</div>
            </div>

            <div className="portalStat portalStat--info">
              <div className="portalStatValue">{periodosActivos}</div>
              <div className="portalStatLabel">Períodos activos</div>
            </div>

            <div className="portalStat portalStat--warn">
              <div className="portalStatValue">{periodosConCarreras}</div>
              <div className="portalStatLabel">Rúbricas habilitadas</div>
            </div>

            <div className="portalStat portalStat--purple">
              <div className="portalStatValue">{docentesActivos}</div>
              <div className="portalStatLabel">Docentes activos</div>
            </div>

            <div className="portalStat portalStat--gray">
              <div className="portalStatValue">{plantillasActivas}</div>
              <div className="portalStatLabel">Plantillas activas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
