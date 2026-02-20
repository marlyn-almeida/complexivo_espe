// ✅ src/pages/actas/ActasFirmadasPage.tsx
import { useEffect, useMemo, useState } from "react";

import escudoESPE from "../../assets/escudo.png";
import "./ActasFirmadasPage.css";

import { Search, RefreshCcw, FileText, Filter, X, BadgeCheck, Download } from "lucide-react";

import { actasService, type ActaListRow } from "../../services/acta.service";
type ToastType = "success" | "error" | "info";

function extractMsg(e: any) {
  const msg = e?.response?.data?.message || e?.userMessage;
  if (typeof msg === "string" && msg.trim()) return msg;
  return e?.message || "Ocurrió un error.";
}

function bool01(v: any): boolean {
  const n = Number(v);
  return v === true || n === 1;
}

export default function ActasFirmadasPage() {
  const [loading, setLoading] = useState(false);

  // DATA
  const [rows, setRows] = useState<ActaListRow[]>([]);

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
      const data = await actasService.listFirmadas();
      setRows((data ?? []) as ActaListRow[]);
    } catch (e: any) {
      setRows([]);
      showToast(extractMsg(e), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return (rows ?? [])
      .filter((r) => {
        // Si backend manda tiene_firmada, filtramos solo firmadas.
        // Si NO manda, igual mostramos todo.
        if (r.tiene_firmada === undefined) return true;
        return bool01(r.tiene_firmada);
      })
      .filter((r) => {
        if (!q) return true;

        const idTe = String(r.id_tribunal_estudiante ?? "");
        const est = String(r.estudiante ?? "").toLowerCase();
        const tri = String(r.tribunal ?? "").toLowerCase();
        const fecha = String(r.fecha ?? "").toLowerCase();

        return idTe.includes(q) || est.includes(q) || tri.includes(q) || fecha.includes(q);
      })
      .sort((a, b) => String(a.estudiante ?? "").localeCompare(String(b.estudiante ?? ""), "es"));
  }, [rows, search]);

  return (
    <div className="actasFirmadasPage">
      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Actas firmadas</h1>
              <p className="heroSubtitle">Repositorio de actas firmadas por tribunal-estudiante. (Director/Apoyo)</p>

              <div className="heroHint">
                Busca por <b>estudiante</b>, <b>tribunal</b> o <b>id tribunal-estudiante</b>.
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
                placeholder="Buscar por estudiante, tribunal, fecha o id..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filterWrap">
              <Filter className="filterIcon" />
              <div className="hintPill">
                Registros: <b>{filtered.length}</b>
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
                  <th className="thCenter">Fecha</th>
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
                ) : filtered.length ? (
                  filtered.map((r, idx) => {
                    const idTe = Number(r.id_tribunal_estudiante ?? 0);
                    const idActa = Number(r.id_acta ?? 0) || 0;

                    return (
                      <tr key={`${idTe}-${idActa}-${idx}`}>
                        <td className="tdCenter mono">
                          <span className="chipCode">{idTe || "—"}</span>
                        </td>

                        <td className="tdCenter tdName">
                          <div className="nameMain">{r.estudiante ?? "-"}</div>
                        </td>

                        <td className="tdCenter">{r.tribunal ?? "-"}</td>

                        <td className="tdCenter">{r.fecha ?? "-"}</td>

                        <td className="tdCenter">
                          <div className="actions">
                            <button
                              className="iconBtn iconBtn_neutral"
                              title="Descargar PDF"
                              onClick={async () => {
                                try {
                                  if (idActa) {
                                    await actasService.downloadPdf(idActa);
                                    return;
                                  }
                                  if (r.pdf_firmado) {
                                    window.open(String(r.pdf_firmado), "_blank", "noopener,noreferrer");
                                    return;
                                  }
                                  showToast("No se pudo determinar el archivo para descargar (id_acta/pdf_firmado).", "error");
                                } catch (e: any) {
                                  showToast(extractMsg(e), "error");
                                }
                              }}
                            >
                              <Download className="iconAction" />
                              <span className="tooltip">PDF</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="emptyCell">
                      <div className="empty">No hay actas firmadas para mostrar.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* helper */}
          <div className="mutedBlock">
            Si en tu backend no viene <b>id_acta</b>, entonces manda <b>pdf_firmado</b> (URL) para poder descargar.
          </div>
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}