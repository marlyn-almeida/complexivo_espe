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

const toYMD = (v: any) => (v ? String(v).slice(0, 10) : "");

export default function RubricasPeriodoPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [periodos, setPeriodos] = useState<PeriodoResumen[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/carreras-periodos/resumen", {
        params: { includeInactive: true },
      });
      setPeriodos(res.data ?? []);
    } catch (e) {
      console.error("Error cargando períodos", e);
    } finally {
      setLoading(false);
    }
  };

  const ensureRubrica = async (idPeriodo: number, tipo: "ORAL" | "ESCRITA") => {
    try {
      const res = await axiosClient.post("/rubricas/ensure", {
        id_periodo: idPeriodo,
        tipo_rubrica: tipo,
      });

      const idRubrica = res.data?.rubrica?.id_rubrica;
      if (!idRubrica) throw new Error("No se pudo obtener la rúbrica");

      navigate(`/rubricas/diseno/${idRubrica}`);
    } catch (e) {
      console.error(e);
      alert("No se pudo crear o cargar la rúbrica");
    }
  };

  return (
    <div className="rp3-page">
      {/* PANEL SUPERIOR */}
      <div className="rp3-panel">
        <h1 className="rp3-title">Rúbricas por Período</h1>
        <p className="rp3-subtitle">
          Selecciona un período y diseña las rúbricas ORAL y ESCRITA del complexivo.
        </p>
      </div>

      {/* TABLA */}
      <div className="rp3-card">
        <div className="rp3-table-scroll">
          <table className="rp3-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Rango</th>
                <th># Carreras</th>
                <th className="rp3-actions-col">Rúbricas</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="td-center">
                    Cargando…
                  </td>
                </tr>
              ) : periodos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="td-center">
                    No existen períodos
                  </td>
                </tr>
              ) : (
                periodos.map((p) => (
                  <tr key={p.id_periodo}>
                    <td className="td-strong">
                      {p.codigo_periodo}
                      <div className="td-mini">{p.descripcion_periodo}</div>
                    </td>

                    <td className="td-muted">
                      {toYMD(p.fecha_inicio)} → {toYMD(p.fecha_fin)}
                    </td>

                    <td>
                      <span className="count-pill">{p.total_asignadas}</span>
                    </td>

                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-action oral"
                          onClick={() => ensureRubrica(p.id_periodo, "ORAL")}
                        >
                          ORAL
                        </button>

                        <button
                          className="btn-action escrita"
                          onClick={() => ensureRubrica(p.id_periodo, "ESCRITA")}
                        >
                          ESCRITA
                        </button>

                        <button
                          className="btn-action view"
                          onClick={() => navigate(`/rubricas/ver/${p.id_periodo}`)}
                        >
                          VER
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
