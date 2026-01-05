import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricasVerPage.css";

type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  ponderacion_global: string | number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number;
};

export default function RubricasVerPage() {
  const { idPeriodo } = useParams();
  const navigate = useNavigate();

  const pid = Number(idPeriodo);

  const [loading, setLoading] = useState(false);
  const [rubrica, setRubrica] = useState<Rubrica | null>(null);

  const load = async () => {
    if (!pid) return;
    setLoading(true);
    try {
      // ✅ endpoint real: obtener por período
      const res = await axiosClient.get(`/rubricas/periodo/${pid}`);
      setRubrica(res.data ?? null);
    } catch (e: any) {
      // si no existe, backend devuelve 404
      console.error(e);
      setRubrica(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPeriodo]);

  const ensureAndOpen = async () => {
    if (!pid) return;
    try {
      setLoading(true);

      // ✅ endpoint real: crear si no existe (idempotente)
      const res = await axiosClient.post(`/rubricas/periodo/${pid}`, {
        nombre_rubrica: "Rúbrica Complexivo",
        ponderacion_global: 100,
        descripcion_rubrica: null,
      });

      const out = res.data as { created: boolean; rubrica: Rubrica };
      const r = out?.rubrica;
      if (!r?.id_rubrica) throw new Error("Respuesta inválida al crear rúbrica");

      navigate(`/rubricas/editar/${r.id_rubrica}`);
    } catch (e) {
      console.error(e);
      alert("No se pudo crear/abrir la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rv-page">
      <div className="rv-panel">
        <div>
          <h1 className="rv-title">Rúbrica del Período #{idPeriodo}</h1>
          <p className="rv-subtitle">
            Esta rúbrica es general para el período. Dentro puedes crear componentes ORAL/ESCRITA.
          </p>
        </div>

        <button className="rv-btn ghost" onClick={() => navigate("/rubricas")}>
          Volver
        </button>
      </div>

      <div className="rv-card">
        <div className="rv-card-head">
          <div>
            <div className="rv-k">Estado</div>
            <div className={`rv-badge ${rubrica?.estado === 1 ? "ok" : "off"}`}>
              {rubrica ? (rubrica.estado === 1 ? "Activa" : "Inactiva") : "No creada"}
            </div>
          </div>

          <div className="rv-actions">
            {rubrica ? (
              <button
                className="rv-btn primary"
                onClick={() => navigate(`/rubricas/editar/${rubrica.id_rubrica}`)}
              >
                Editar rúbrica
              </button>
            ) : (
              <button className="rv-btn primary" onClick={ensureAndOpen}>
                Crear rúbrica
              </button>
            )}
          </div>
        </div>

        <div className="rv-body">
          <div className="rv-row">
            <span className="k">Nombre</span>
            <span className="v">{rubrica?.nombre_rubrica ?? "—"}</span>
          </div>
          <div className="rv-row">
            <span className="k">Ponderación global</span>
            <span className="v">{rubrica?.ponderacion_global ?? "—"}</span>
          </div>
          <div className="rv-row">
            <span className="k">Descripción</span>
            <span className="v">{rubrica?.descripcion_rubrica ?? "—"}</span>
          </div>

          {!rubrica && (
            <div className="rv-hint">
              Primero crea la rúbrica. Luego podrás agregar niveles, componentes y criterios.
            </div>
          )}
        </div>
      </div>

      {loading && <div className="rv-muted">Cargando…</div>}
    </div>
  );
}
