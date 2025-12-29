import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricasPeriodoPage.css";

type CarreraPeriodo = {
  id_carrera_periodo: number;
  nombre_carrera: string;
  codigo_periodo: string;
  descripcion_periodo: string;
  estado_cp?: number;
  estado?: number;
};

export default function RubricasPeriodoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CarreraPeriodo[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get("/carreras-periodos/list", { params: { includeInactive: true }});

        setData(res.data ?? []);
      } catch (e) {
        console.error("Error cargando carrera-periodo", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="rp-page">
      <div className="rp-card">
        <h2 className="rp-title">Rúbricas por Carrera y Período</h2>
        <p className="rp-subtitle">
          Selecciona el período y la carrera para crear o diseñar la rúbrica
        </p>

        {loading && <div className="rp-muted">Cargando…</div>}

        {!loading && (
          <table className="rp-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Carrera</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const estado = row.estado_cp ?? row.estado ?? 1;
                return (
                  <tr key={row.id_carrera_periodo}>
                    <td>{row.codigo_periodo}</td>
                    <td>{row.nombre_carrera}</td>
                    <td>
                      {Number(estado) === 1 ? (
                        <span className="rp-badge rp-ok">Activo</span>
                      ) : (
                        <span className="rp-badge rp-off">Inactivo</span>
                      )}
                    </td>
                    <td className="rp-actions">
                      <button
                        className="rp-btn rp-primary"
                        onClick={() =>
                          navigate(`/rubricas/diseno/${row.id_carrera_periodo}`)
                        }
                      >
                        Diseñar
                      </button>

                      <button
                        className="rp-btn rp-secondary"
                        onClick={() =>
                          navigate(`/rubricas/ver/${row.id_carrera_periodo}`)
                        }
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}

              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="rp-muted">
                    No existen carreras asignadas a períodos
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
