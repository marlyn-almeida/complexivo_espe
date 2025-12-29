import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricasPorPeriodoPage.css";

type CarreraPeriodoRow = {
  id_carrera_periodo: number;
  nombre_carrera: string;
  estado: number;
};

export default function RubricasPorPeriodoPage() {
  const { idPeriodo } = useParams();
  const periodoId = Number(idPeriodo);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CarreraPeriodoRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/carreras-periodos/por-periodo/${periodoId}`, {
          params: { includeInactive: true },
        });
        setRows(res.data ?? []);
      } catch (e) {
        console.error("Error cargando carreras por período", e);
      } finally {
        setLoading(false);
      }
    };
    if (!Number.isNaN(periodoId)) load();
  }, [periodoId]);

  return (
    <div className="rp-page">
      <div className="rp-card">
        <div className="rpp-top">
          <div>
            <h2 className="rp-title">Carreras del Período #{periodoId}</h2>
            <p className="rp-subtitle">
              Selecciona el conjunto (id_carrera_periodo) para crear/diseñar la rúbrica.
            </p>
          </div>

          <button className="rp-btn rp-secondary" onClick={() => navigate("/rubricas")}>
            Volver
          </button>
        </div>

        {loading && <div className="rp-muted">Cargando…</div>}

        {!loading && (
          <table className="rp-table">
            <thead>
              <tr>
                <th>ID carrera_periodo</th>
                <th>Carrera</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id_carrera_periodo}>
                  <td><b>{r.id_carrera_periodo}</b></td>
                  <td>{r.nombre_carrera}</td>
                  <td>
                    {r.estado === 1 ? (
                      <span className="rp-badge rp-ok">Activo</span>
                    ) : (
                      <span className="rp-badge rp-off">Inactivo</span>
                    )}
                  </td>
                  <td className="rp-actions">
                    <button
                      className="rp-btn rp-primary"
                      onClick={() => navigate(`/rubricas/diseno/${r.id_carrera_periodo}`)}
                    >
                      Crear / Diseñar
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="rp-muted">
                    No existen carreras asignadas a este período
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
