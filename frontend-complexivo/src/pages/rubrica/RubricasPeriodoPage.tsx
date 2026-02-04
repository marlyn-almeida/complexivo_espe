import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

import { Search, List, Hash, Settings } from "lucide-react";
import escudoESPE from "../../assets/escudo.png";
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

  async function load() {
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
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <div className="wrap rubricasPage">
      <div className="containerFull">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">RÚBRICAS</h1>
              <p className="heroSubtitle">Gestión de rúbricas por período académico</p>
            </div>
          </div>
        </div>

        {/* BOX */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <List className="iconSm" />
              </span>
              Períodos académicos
            </div>

            <div className="searchWrap">
              <Search className="searchIcon" />
              <input
                className="search"
                placeholder="Buscar por código o descripción…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load();
                }}
              />
            </div>
          </div>

          {/* TABLA */}
          <div className="tableWrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <span className="thInline">
                      <List className="iconSm" />
                      Período
                    </span>
                  </th>

                  <th>
                    <span className="thInline">
                      <Hash className="iconSm" />
                      # Carreras
                    </span>
                  </th>

                  <th className="thActions">
                    <span className="thInline">
                      <Settings className="iconSm" />
                      Acciones
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="emptyCell">
                      <div className="empty">
                        <div className="emptyText">Cargando...</div>
                      </div>
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((row) => {
                    const tieneCarreras = Number(row.total_asignadas || 0) > 0;

                    return (
                      <tr key={row.id_periodo}>
                        <td>
                          <div className="nameMain">{row.codigo_periodo}</div>
                          <div className="nameSub">{row.descripcion_periodo}</div>
                        </td>

                        <td>
                          {tieneCarreras ? (
                            <span className="badgeActive">{row.total_asignadas}</span>
                          ) : (
                            <span className="badgeInactive">0</span>
                          )}
                        </td>

                        <td className="tdActions">
                          <div className="actions">
                            <button
                              className="btnPrimary"
                              disabled={!tieneCarreras}
                              title={
                                !tieneCarreras
                                  ? "Asigna carreras al período primero"
                                  : "Gestionar rúbrica"
                              }
                              onClick={() => navigate(`/rubricas/periodo/${row.id_periodo}`)}
                            >
                              Gestionar rúbrica
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="emptyCell">
                      <div className="empty">
                        <div className="emptyText">No existen períodos registrados.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
