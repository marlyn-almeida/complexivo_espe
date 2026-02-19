// ✅ src/pages/actas/ActasFirmadasPage.tsx
import { useEffect, useMemo, useState } from "react";

import escudoESPE from "../../assets/escudo.png";
import "./ActasFirmadasPage.css";

import { Search, RefreshCcw, FileText, Filter, X, BadgeCheck } from "lucide-react";

type ToastType = "success" | "error" | "info";

export default function ActasFirmadasPage() {
  const [loading, setLoading] = useState(false);

  // UI
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  async function load() {
    setLoading(true);
    try {
      // ✅ Pendiente: conectar endpoint real de actas firmadas
      // Aquí solo mantenemos el módulo visible y con UI lista.
      await new Promise((r) => setTimeout(r, 350));
    } catch {
      showToast("Error al cargar actas firmadas", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Cuando tengas endpoint, esto pasará a filtrar un array real
  const data = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return [];
  }, [search]);

  return (
    <div className="actasFirmadasPage">
      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Actas firmadas</h1>
              <p className="heroSubtitle">
                Repositorio de actas firmadas por tribunal-estudiante. (Módulo del Director/Apoyo)
              </p>

              <div className="heroHint">
                Este módulo se conectará al endpoint cuando esté listo en backend.
              </div>
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn ghost" onClick={load} disabled={loading} title="Actualizar">
              <RefreshCcw className="heroBtnIcon" />
              Actualizar
            </button>
          </div>
        </div>

        {/* BOX */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <FileText size={18} />
              </span>
              Listado de actas firmadas
            </div>

            <div className="boxRight">
              <div className="statePill on">
                <BadgeCheck size={16} />
                <span>Director / Apoyo</span>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="filtersRow">
            <div className="searchWrap">
              <Search className="searchIcon" />
              <input
                className="search"
                placeholder="Buscar por estudiante, tribunal, período o id..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filterWrap">
              <Filter className="filterIcon" />
              <div className="hintPill">
                Estado: <b>PENDIENTE BACKEND</b>
              </div>

              {search.trim() && (
                <button className="chipClear" onClick={() => setSearch("")} title="Quitar búsqueda">
                  <X size={14} /> Quitar
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="thCenter">Tribunal-Estudiante</th>
                  <th className="thCenter thName">Estudiante</th>
                  <th className="thCenter">Tribunal</th>
                  <th className="thCenter">Período</th>
                  <th className="thCenter thState">Archivo</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="emptyCell">
                      <div className="empty">Cargando...</div>
                    </td>
                  </tr>
                ) : data.length ? (
                  data.map((x: any) => (
                    <tr key={String(x.id)}>
                      <td className="tdCenter">—</td>
                      <td className="tdCenter">—</td>
                      <td className="tdCenter">—</td>
                      <td className="tdCenter">—</td>
                      <td className="tdCenter">—</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="emptyCell">
                      <div className="empty">
                        Aún no hay endpoint conectado para actas firmadas. Cuando lo tengas, aquí se listarán.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* helper */}
          <div className="mutedBlock">
            Cuando tengas el endpoint, me pasas:
            <b> ruta, response JSON y nombre de campos</b> y lo conecto en una sola iteración.
          </div>
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
