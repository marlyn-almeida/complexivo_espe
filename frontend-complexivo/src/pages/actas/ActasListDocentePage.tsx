// ✅ src/pages/actas/ActasListDocentePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import escudoESPE from "../../assets/escudo.png";
import "./ActasListDocentePage.css";

import { tribunalEstudiantesService } from "../../services/tribunalEstudiantes.service";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";

import { Eye, Search, RefreshCcw, FileText, BadgeCheck, BadgeX, Filter, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

function extractMsg(e: any) {
  const msg = e?.response?.data?.message || e?.userMessage;
  if (typeof msg === "string" && msg.trim()) return msg;
  return e?.message || "Ocurrió un error.";
}

function cerrado01(v: any): boolean {
  const n = Number(v);
  return n === 1 || v === true;
}

export default function ActasListDocentePage() {
  const nav = useNavigate();

  const [rows, setRows] = useState<TribunalEstudiante[]>([]);
  const [loading, setLoading] = useState(false);

  // UI
  const [search, setSearch] = useState("");
  const [soloCerrados, setSoloCerrados] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  async function load() {
    setLoading(true);
    try {
      // ✅ endpoint existente: agenda del docente
      const data = await tribunalEstudiantesService.misAsignaciones({ includeInactive: false });
      setRows((data ?? []) as TribunalEstudiante[]);
    } catch (e: any) {
      setRows([]);
      showToast(extractMsg(e), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return (rows ?? [])
      .filter((r: any) => (soloCerrados ? cerrado01((r as any).cerrado) : true))
      .filter((r: any) => {
        if (!q) return true;

        const idTe = String((r as any).id_tribunal_estudiante ?? (r as any).id ?? "");
        const est = String((r as any).estudiante ?? (r as any).estudiante_label ?? "").toLowerCase();
        const tri = String((r as any).tribunal ?? (r as any).nombre_tribunal ?? "").toLowerCase();

        return idTe.includes(q) || est.includes(q) || tri.includes(q);
      })
      .sort((a: any, b: any) => {
        const ca = Number((a as any).cerrado ?? 0);
        const cb = Number((b as any).cerrado ?? 0);
        if (cb !== ca) return cb - ca;
        const ea = String((a as any).estudiante ?? "");
        const eb = String((b as any).estudiante ?? "");
        return ea.localeCompare(eb, "es");
      });
  }, [rows, search, soloCerrados]);

  const total = rows.length;
  const cerrados = rows.filter((r: any) => cerrado01((r as any).cerrado)).length;
  const abiertos = total - cerrados;

  return (
    <div className="actasListPage">
      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Actas</h1>
              <p className="heroSubtitle">
                Aquí se muestran tus <b>tribunales cerrados</b> para generar/descargar/subir el acta firmada.
              </p>

              <div className="heroHint">
                Consejo: solo cuando esté <b>CERRADO</b> podrás generar el acta.
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
              Listado de actas (por tribunal)
            </div>

            <div className="boxRight">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={soloCerrados}
                  onChange={(e) => setSoloCerrados(e.target.checked)}
                />
                <span className="slider" />
                <span className="toggleText">Solo cerrados</span>
              </label>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="summaryRow">
            <div className="summaryBoxes">
              <div className="summaryBox">
                <span className="summaryLabel">Total</span>
                <span className="summaryValue">{total}</span>
              </div>

              <div className="summaryBox active">
                <span className="summaryLabel">Cerrados</span>
                <span className="summaryValue">{cerrados}</span>
              </div>

              <div className="summaryBox inactive">
                <span className="summaryLabel">Abiertos</span>
                <span className="summaryValue">{abiertos}</span>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="filtersRow">
            <div className="searchWrap">
              <Search className="searchIcon" />
              <input
                className="search"
                placeholder="Buscar por Tribunal-Estudiante, tribunal o estudiante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filterWrap">
              <Filter className="filterIcon" />
              <div className="hintPill">
                Mostrando: <b>{soloCerrados ? "CERRADOS" : "TODOS"}</b>
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
                  <th className="thCenter thTrib">Tribunal</th>
                  <th className="thCenter thState">Estado</th>
                  <th className="thCenter thActions">Acciones</th>
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
                  filtered.map((r: any) => {
                    const idTe = Number((r as any).id_tribunal_estudiante ?? (r as any).id ?? 0);
                    const est = String((r as any).estudiante ?? (r as any).estudiante_label ?? "-");
                    const trib = String((r as any).tribunal ?? (r as any).nombre_tribunal ?? "-");
                    const isCerrado = cerrado01((r as any).cerrado);

                    return (
                      <tr key={idTe || `${est}-${trib}`}>
                        <td className="tdCenter mono">
                          <span className="chipCode">{idTe || "—"}</span>
                        </td>

                        <td className="tdCenter tdName">
                          <div className="nameMain">{est}</div>
                        </td>

                        <td className="tdCenter">{trib}</td>

                        <td className="tdCenter">
                          {isCerrado ? (
                            <span className="badgeActive">
                              <BadgeCheck className="badgeIcon" size={16} />
                              CERRADO
                            </span>
                          ) : (
                            <span className="badgeInactive">
                              <BadgeX className="badgeIcon" size={16} />
                              ABIERTO
                            </span>
                          )}
                        </td>

                        <td className="tdActions tdCenter">
                          <div className="actions">
                            <button
                              className="iconBtn iconBtn_neutral"
                              title="Ver Acta"
                              onClick={() => {
                                if (!idTe) return showToast("No se pudo determinar idTribunalEstudiante.", "error");
                                nav(`/actas/${idTe}`);
                              }}
                            >
                              <Eye className="iconAction" />
                              <span className="tooltip">Acta</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="emptyCell">
                      <div className="empty">
                        {soloCerrados
                          ? "No tienes tribunales cerrados todavía."
                          : "No hay registros para mostrar."}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
