import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

import { Search } from "lucide-react";
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

  // Para mostrar rango amigable (si más adelante quieres formatear fechas)
  const rows = useMemo(() => data ?? [], [data]);

  return (
    <div className="page">
      {/* HEADER en CARD (como Estudiantes) */}
      <div className="card">
        <div className="headerRow">
          <div>
            <h2 className="title">Rúbricas</h2>
            <p className="subtitle">
              Selecciona un período y crea/edita la rúbrica general de ese período.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btnSecondary" onClick={load} disabled={loading} title="Actualizar">
              ⟳ Actualizar
            </button>
          </div>
        </div>

        {/* FILTROS (igual estilo) */}
        <div className="filtersRow">
          <div className="searchInline">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por código o descripción…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
          </div>

          <button className="btnPrimary" onClick={load} disabled={loading}>
            Buscar
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="card tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Rango</th>
              <th># Carreras</th>
              <th className="thActions">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="muted" style={{ padding: 16 }}>
                  Cargando...
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((row) => {
                const tieneCarreras = Number(row.total_asignadas || 0) > 0;

                return (
                  <tr key={row.id_periodo}>
                    <td>
                      <div className="tdStrong">{row.codigo_periodo}</div>
                      <div className="muted" style={{ marginTop: 6, fontWeight: 800 }}>
                        {row.descripcion_periodo}
                      </div>
                    </td>

                    <td className="tdStrong">
                      {row.fecha_inicio} → {row.fecha_fin}
                    </td>

                    <td>
                      <span className={`badge ${tieneCarreras ? "badge-success" : "badge-danger"}`}>
                        {row.total_asignadas}
                      </span>
                    </td>

                    <td className="actions">
                      <button
                        className="btnPrimary"
                        disabled={!tieneCarreras}
                        onClick={() => navigate(`/rubricas/periodo/${row.id_periodo}`)}
                        title={!tieneCarreras ? "Asigna carreras al período primero" : "Abrir rúbrica"}
                      >
                        Abrir rúbrica
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="muted" style={{ padding: 16 }}>
                  No existen períodos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
