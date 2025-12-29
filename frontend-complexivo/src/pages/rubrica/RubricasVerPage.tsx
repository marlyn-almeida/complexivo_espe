import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricasVerPage.css";

type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  tipo_rubrica: "ORAL" | "ESCRITA";
  ponderacion_global: string | number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number;
};

export default function RubricasVerPage() {
  const { idPeriodo } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rubricas, setRubricas] = useState<Rubrica[]>([]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPeriodo]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/rubricas", {
        params: { periodoId: Number(idPeriodo), includeInactive: true },
      });
      setRubricas(res.data ?? []);
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar las rúbricas del período");
    } finally {
      setLoading(false);
    }
  };

  const ensureAndGo = async (tipo: "ORAL" | "ESCRITA") => {
    try {
      const res = await axiosClient.post("/rubricas/ensure", {
        id_periodo: Number(idPeriodo),
        tipo_rubrica: tipo,
      });
      const idRubrica = res.data?.rubrica?.id_rubrica;
      if (!idRubrica) throw new Error("No vino id_rubrica");
      navigate(`/rubricas/diseno/${idRubrica}`);
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir la rúbrica");
    }
  };

  const oral = rubricas.find((r) => r.tipo_rubrica === "ORAL");
  const escrita = rubricas.find((r) => r.tipo_rubrica === "ESCRITA");

  return (
    <div className="rv-page">
      <div className="rv-panel">
        <div>
          <h1 className="rv-title">Ver Rúbricas del Período</h1>
          <p className="rv-subtitle">Aquí deben existir dos: ORAL y ESCRITA.</p>
        </div>

        <button className="rv-btn back" onClick={() => navigate("/rubricas")}>
          Volver
        </button>
      </div>

      <div className="rv-grid">
        <div className="rv-card">
          <div className="rv-card-head">
            <h2>ORAL</h2>
            <span className={`badge ${oral?.estado === 1 ? "ok" : "off"}`}>
              {oral?.estado === 1 ? "Activa" : oral ? "Inactiva" : "No creada"}
            </span>
          </div>

          <div className="rv-body">
            <div className="rv-row">
              <span className="k">Nombre</span>
              <span className="v">{oral?.nombre_rubrica ?? "—"}</span>
            </div>
            <div className="rv-row">
              <span className="k">Ponderación global</span>
              <span className="v">{oral?.ponderacion_global ?? "—"}</span>
            </div>
            <div className="rv-row">
              <span className="k">Descripción</span>
              <span className="v">{oral?.descripcion_rubrica ?? "—"}</span>
            </div>

            <button className="rv-btn oral" onClick={() => ensureAndGo("ORAL")}>
              Crear / Editar ORAL
            </button>
          </div>
        </div>

        <div className="rv-card">
          <div className="rv-card-head">
            <h2>ESCRITA</h2>
            <span className={`badge ${escrita?.estado === 1 ? "ok" : "off"}`}>
              {escrita?.estado === 1 ? "Activa" : escrita ? "Inactiva" : "No creada"}
            </span>
          </div>

          <div className="rv-body">
            <div className="rv-row">
              <span className="k">Nombre</span>
              <span className="v">{escrita?.nombre_rubrica ?? "—"}</span>
            </div>
            <div className="rv-row">
              <span className="k">Ponderación global</span>
              <span className="v">{escrita?.ponderacion_global ?? "—"}</span>
            </div>
            <div className="rv-row">
              <span className="k">Descripción</span>
              <span className="v">{escrita?.descripcion_rubrica ?? "—"}</span>
            </div>

            <button
              className="rv-btn escrita"
              onClick={() => ensureAndGo("ESCRITA")}
            >
              Crear / Editar ESCRITA
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="rv-muted">Cargando…</div>}
    </div>
  );
}
