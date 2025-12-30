import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricasPeriodoPage.css";

type PeriodoResumen = {
  id_periodo: number;
  codigo_periodo: string;
  descripcion_periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_asignadas: number;
};

export default function RubricasPeriodoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PeriodoResumen[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/carreras-periodos/resumen", {
        params: { includeInactive: true, q: q.trim() || undefined },
      });
      setData(res.data ?? []);
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar el resumen de períodos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">Rúbricas</h1>
          <p className="rp-subtitle">
            Selecciona un período y crea/edita la rúbrica general de ese período.
          </p>
        </div>
      </div>

      <div className="rp-card">
        <div className="rp-toolbar">
          <input
            className="rp-input"
            placeholder="Buscar por código o descripción…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="rp-btn rp-ghost" onClick={load}>
            Buscar
          </button>
        </div>

        {loading && <div className="rp-muted">Cargando…</div>}

        {!loading && (
          <table className="rp-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Rango</th>
                <th>#Carreras</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id_periodo}>
                  <td>
                    <div className="rp-strong">{row.codigo_periodo}</div>
                    <div className="rp-muted">{row.descripcion_periodo}</div>
                  </td>
                  <td>
                    {row.fecha_inicio} → {row.fecha_fin}
                  </td>
                  <td>
                    <span className={`rp-pill ${row.total_asignadas > 0 ? "ok" : ""}`}>
                      {row.total_asignadas}
                    </span>
                  </td>
                  <td className="rp-actions">
                    <button
                      className="rp-btn rp-primary"
                      disabled={row.total_asignadas === 0}
                      onClick={() => navigate(`/rubricas/periodo/${row.id_periodo}`)}
                      title={row.total_asignadas === 0 ? "Asigna carreras al período primero" : ""}
                    >
                      Abrir rúbrica
                    </button>
                  </td>
                </tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="rp-muted">
                    No existen períodos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
