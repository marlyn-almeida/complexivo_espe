import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Users, Search, RefreshCw } from "lucide-react";

import "./CarreraPeriodoPage.css";

import type { Carrera } from "../../types/carrera";
import type { CarreraPeriodo, PeriodoResumen } from "../../types/carreraPeriodo";

import { carrerasService } from "../../services/carreras.service";
import {
  carreraPeriodoService,
  type CarreraPeriodoAdminsResponse,
  type CarreraPeriodoAdminsUpdateDTO,
} from "../../services/carreraPeriodo.service";

const PAGE_SIZE = 10;

const toYMD = (v: any) => (v ? String(v).slice(0, 10) : "");

// ✅ FIX: aceptar undefined/null para que no reviente TS
const isActive = (estado?: boolean | number | null) => {
  if (estado === undefined || estado === null) return false;
  return typeof estado === "boolean" ? estado : Number(estado) === 1;
};

function periodoLabel(p: PeriodoResumen) {
  const codigo = p.codigo_periodo ?? "";
  const desc = p.descripcion_periodo ?? "";
  const fi = toYMD(p.fecha_inicio);
  const ff = toYMD(p.fecha_fin);
  const base = [codigo, desc].filter(Boolean).join(" · ");
  const rango = fi && ff ? ` (${fi} → ${ff})` : "";
  return (base || `Período #${p.id_periodo}`) + rango;
}

function carreraMeta(x: any) {
  const parts = [x.codigo_carrera, x.modalidad, x.sede].filter(Boolean);
  return parts.join(" · ");
}

type ToastType = "success" | "error" | "info";

export default function CarreraPeriodoPage() {
  // base
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  const [carreras, setCarreras] = useState<Carrera[]>([]);

  // tabla principal: periodos
  const [periodos, setPeriodos] = useState<PeriodoResumen[]>([]);
  const [qPeriodos, setQPeriodos] = useState("");
  const [includeInactiveCount, setIncludeInactiveCount] = useState(false);

  // paginación
  const [page, setPage] = useState(1);

  // modal general (assign/view/edit)
  const [modalMode, setModalMode] = useState<null | "assign" | "view" | "edit">(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodoResumen | null>(null);

  // datos del período (carreras asignadas)
  const [periodoItems, setPeriodoItems] = useState<CarreraPeriodo[]>([]);
  const [periodoSearch, setPeriodoSearch] = useState("");
  const [periodoIncludeInactive, setPeriodoIncludeInactive] = useState(true);

  // selección por bloques
  const [selectSearch, setSelectSearch] = useState("");
  const [selectedCarreraIds, setSelectedCarreraIds] = useState<Set<number>>(new Set());

  // =========================
  // ✅ MODAL Autoridades (director/apoyo) para UNA carrera_periodo
  // =========================
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authSaving, setAuthSaving] = useState(false);

  const [selectedCP, setSelectedCP] = useState<CarreraPeriodo | null>(null);

  const [admins, setAdmins] = useState<CarreraPeriodoAdminsResponse | null>(null);
  const [dirId, setDirId] = useState<string>("");
  const [apoId, setApoId] = useState<string>("");

  // docentes para selects del modal autoridades
  const [docentes, setDocentes] = useState<any[]>([]);
  const [loadingDocentes, setLoadingDocentes] = useState(false);

  function formatAdminLite(a?: CarreraPeriodoAdminsResponse["director"] | null) {
    if (!a) return "— Sin asignar —";
    const full = `${a.apellidos_docente} ${a.nombres_docente}`.trim();
    const user = a.nombre_usuario ? ` (${a.nombre_usuario})` : "";
    return full + user;
  }

  async function openAutoridadesModal(cp: CarreraPeriodo) {
    if (!cp?.id_carrera_periodo) return;

    setSelectedCP(cp);
    setShowAuthModal(true);
    setAuthLoading(true);
    setAdmins(null);
    setDirId("");
    setApoId("");

    try {
      // cargar docentes (una vez)
      if (!docentes.length) {
        setLoadingDocentes(true);
        try {
          const list = await (await import("../../services/docentes.service")).docentesService.list(false);
          setDocentes((list || []).filter((d: any) => Number(d.estado) === 1));
        } finally {
          setLoadingDocentes(false);
        }
      }

      // cargar admins del cp
      const data = await carreraPeriodoService.getAdmins(cp.id_carrera_periodo);
      setAdmins(data);
      setDirId(data.director?.id_docente ? String(data.director.id_docente) : "");
      setApoId(data.apoyo?.id_docente ? String(data.apoyo.id_docente) : "");
    } catch (err: any) {
      showToast(err?.userMessage || "No se pudo cargar autoridades", "error");
      setAdmins(null);
      setDirId("");
      setApoId("");
    } finally {
      setAuthLoading(false);
    }
  }

  function closeAutoridadesModal() {
    setShowAuthModal(false);
    setSelectedCP(null);
    setAdmins(null);
    setDirId("");
    setApoId("");
  }

  async function onSaveAutoridades() {
    if (!selectedCP) return;

    if (dirId && apoId && dirId === apoId) {
      showToast("Director y Apoyo no pueden ser el mismo docente.", "error");
      return;
    }

    setAuthSaving(true);
    try {
      const payload: CarreraPeriodoAdminsUpdateDTO = {
        id_docente_director: dirId ? Number(dirId) : null,
        id_docente_apoyo: apoId ? Number(apoId) : null,
      };

      const saved = await carreraPeriodoService.setAdmins(selectedCP.id_carrera_periodo, payload);
      setAdmins(saved);

      showToast("Autoridades guardadas.", "success");
      setShowAuthModal(false);

      // ✅ refrescar la lista "ver" para que se vea reflejado (si sigue abierto)
      if (selectedPeriodo?.id_periodo) {
        await fetchPeriodoItems(selectedPeriodo.id_periodo, { includeInactive: true, q: periodoSearch });
      }
    } catch (err: any) {
      showToast(err?.userMessage || "No se pudo guardar autoridades", "error");
    } finally {
      setAuthSaving(false);
    }
  }

  // =========================
  // Helpers memo
  // =========================
  const carrerasSorted = useMemo(() => {
    const arr = [...carreras];
    arr.sort((a: any, b: any) => String(a.nombre_carrera || "").localeCompare(String(b.nombre_carrera || "")));
    return arr;
  }, [carreras]);

  const carrerasFiltradas = useMemo(() => {
    const term = selectSearch.trim().toLowerCase();
    if (!term) return carrerasSorted;
    return carrerasSorted.filter((c: any) => {
      const n = String(c.nombre_carrera || "").toLowerCase();
      const code = String(c.codigo_carrera || "").toLowerCase();
      const sede = String(c.sede || "").toLowerCase();
      const mod = String(c.modalidad || "").toLowerCase();
      return n.includes(term) || code.includes(term) || sede.includes(term) || mod.includes(term);
    });
  }, [selectSearch, carrerasSorted]);

  const filteredPeriodos = useMemo(() => {
    const term = qPeriodos.trim().toLowerCase();
    if (!term) return periodos;
    return periodos.filter((p) => {
      const c = String(p.codigo_periodo || "").toLowerCase();
      const d = String(p.descripcion_periodo || "").toLowerCase();
      return c.includes(term) || d.includes(term);
    });
  }, [periodos, qPeriodos]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filteredPeriodos.length / PAGE_SIZE)), [filteredPeriodos.length]);

  const pagedPeriodos = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPeriodos.slice(start, start + PAGE_SIZE);
  }, [filteredPeriodos, page]);

  const carreraAsignadaMap = useMemo(() => {
    const m = new Map<number, CarreraPeriodo>();
    periodoItems.forEach((x) => m.set(Number(x.id_carrera), x));
    return m;
  }, [periodoItems]);

  // =========================
  // Fetch
  // =========================
  const fetchCarreras = async () => {
    const cs = await carrerasService.list();
    setCarreras(cs ?? []);
  };

  const fetchResumen = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await carreraPeriodoService.resumen({
        includeInactive: includeInactiveCount,
        q: qPeriodos,
      });
      setPeriodos(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (e: any) {
      setErrorMsg(e?.userMessage || "Error cargando períodos");
      setPeriodos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodoItems = async (periodoId: number, opts?: { includeInactive?: boolean; q?: string }) => {
    setLoading(true);
    try {
      const data = await carreraPeriodoService.listByPeriodo(periodoId, {
        includeInactive: opts?.includeInactive ?? periodoIncludeInactive,
        q: opts?.q ?? periodoSearch,
      });
      setPeriodoItems(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCarreras(), fetchResumen()]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactiveCount]);

  // Cuando cambian filtros de modal (ver/editar), recarga items del periodo
  useEffect(() => {
    if (!selectedPeriodo) return;
    if (modalMode === "view" || modalMode === "edit") {
      fetchPeriodoItems(selectedPeriodo.id_periodo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoSearch, periodoIncludeInactive]);

  // =========================
  // Modal actions
  // =========================
  const openModal = async (mode: "assign" | "view" | "edit", p: PeriodoResumen) => {
    setSelectedPeriodo(p);
    setModalMode(mode);

    // reset filtros modal
    setPeriodoSearch("");
    setPeriodoIncludeInactive(true);
    setSelectSearch("");

    // siempre cargamos asignadas (para ver, para editar, y para bloquear en assign)
    await fetchPeriodoItems(p.id_periodo, { includeInactive: true, q: "" });

    if (mode === "assign") {
      setSelectedCarreraIds(new Set());
    }

    if (mode === "view") {
      setSelectedCarreraIds(new Set());
    }

    if (mode === "edit") {
      const activeIds = new Set<number>();
      const items = await carreraPeriodoService.listByPeriodo(p.id_periodo, { includeInactive: true, q: "" });
      setPeriodoItems(items ?? []);
      (items ?? []).forEach((x) => {
        if (isActive(x.estado)) activeIds.add(Number(x.id_carrera));
      });
      setSelectedCarreraIds(activeIds);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedPeriodo(null);
    setPeriodoItems([]);
    setSelectedCarreraIds(new Set());
    setSelectSearch("");
    setPeriodoSearch("");
    setPeriodoIncludeInactive(true);
  };

  // =========================
  // Selection helpers
  // =========================
  const toggleSelect = (id: number) => {
    setSelectedCarreraIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedCarreraIds((prev) => {
      const next = new Set(prev);
      carrerasFiltradas.forEach((c: any) => next.add(Number(c.id_carrera)));
      return next;
    });
  };

  const clearSelection = () => setSelectedCarreraIds(new Set());

  // =========================
  // Submit handlers
  // =========================
  const onSubmitAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodo) return;

    const ids = Array.from(selectedCarreraIds);
    if (!ids.length) return alert("Selecciona al menos una carrera.");

    setLoading(true);
    try {
      await carreraPeriodoService.bulkAssign({
        id_periodo: selectedPeriodo.id_periodo,
        carreraIds: ids,
      });

      await fetchResumen();
      await fetchPeriodoItems(selectedPeriodo.id_periodo, { includeInactive: true, q: "" });
      closeModal();
    } catch (err: any) {
      alert(err?.userMessage || "No se pudo asignar carreras.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodo) return;

    const ids = Array.from(selectedCarreraIds);

    setLoading(true);
    try {
      await carreraPeriodoService.sync({
        id_periodo: selectedPeriodo.id_periodo,
        carreraIds: ids,
      });

      await fetchResumen();
      await fetchPeriodoItems(selectedPeriodo.id_periodo, { includeInactive: true, q: "" });
      closeModal();
    } catch (err: any) {
      alert(err?.userMessage || "No se pudo guardar cambios.");
    } finally {
      setLoading(false);
    }
  };

  const modalTitle =
    modalMode === "assign" ? "Asignar carreras" : modalMode === "edit" ? "Editar carreras del período" : "Ver carreras asignadas";

  // =========================
  // Render
  // =========================
  return (
    <div className="adminPage">
      <div className="adminCard">
        <div className="adminHeader">
          <div className="adminTitle">
            <Users size={20} />
            <div>
              <div className="h1">Carrera – Período</div>
              <div className="h2">Listado de períodos con acciones para asignar, ver y editar carreras</div>
              <div className="h3">ESPE ITIV</div>
            </div>
          </div>

          <div />

          <button className="btnPrimary" onClick={fetchResumen} disabled={loading} title="Actualizar">
            <RefreshCw size={18} />
            Actualizar
          </button>
        </div>

        <div className="adminInfo">
          <div className="infoItem">
            <span className="k">Períodos listados</span>
            <span className="v">{filteredPeriodos.length}</span>
          </div>

          <div className="infoItem">
            <span className="k">Carreras cargadas</span>
            <span className="v">{carreras.length}</span>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Períodos</div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div className="searchBox">
                <Search size={18} />
                <input
                  value={qPeriodos}
                  onChange={(e) => setQPeriodos(e.target.value)}
                  placeholder="Buscar período…"
                />
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={includeInactiveCount}
                  onChange={(e) => setIncludeInactiveCount(e.target.checked)}
                />
                <span className="slider" />
                <span className="switch-text">Contar inactivas</span>
              </label>

              <button className="btnSmall" onClick={fetchResumen} disabled={loading}>
                Buscar
              </button>
            </div>
          </div>

          {errorMsg && <div style={{ padding: 12, color: "#b91c1c", fontWeight: 900 }}>{errorMsg}</div>}

          <div className="list">
            {loading ? (
              <div style={{ padding: 12, fontWeight: 900, color: "rgba(0,0,0,.6)" }}>Cargando…</div>
            ) : pagedPeriodos.length === 0 ? (
              <div style={{ padding: 12, fontWeight: 900, color: "rgba(0,0,0,.6)" }}>Sin períodos</div>
            ) : (
              pagedPeriodos.map((p) => {
                const rango = `${toYMD(p.fecha_inicio)} → ${toYMD(p.fecha_fin)}`;
                return (
                  <div key={p.id_periodo} className="listItem" style={{ cursor: "default" }}>
                    <div className="liMain">{(p.codigo_periodo || "—") as any}</div>
                    <div className="liSub">{p.descripcion_periodo || ""}</div>
                    <div className="liSub">{rango}</div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                      <div className="liSub">
                        Carreras asignadas: <b>{Number(p.total_asignadas ?? 0)}</b>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btnSmall" onClick={() => openModal("assign", p)}>
                          Asignar
                        </button>
                        <button className="btnSmall" onClick={() => openModal("view", p)}>
                          Ver
                        </button>
                        <button className="btnSmall" onClick={() => openModal("edit", p)}>
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ padding: 12, display: "flex", justifyContent: "center", gap: 10, alignItems: "center" }}>
            <button className="btnGhost" onClick={() => setPage((x) => Math.max(1, x - 1))} disabled={page <= 1}>
              ◀
            </button>
            <span style={{ fontWeight: 900, color: "rgba(0,0,0,.65)" }}>
              Página <b>{page}</b> de <b>{pageCount}</b>
            </span>
            <button className="btnGhost" onClick={() => setPage((x) => Math.min(pageCount, x + 1))} disabled={page >= pageCount}>
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* MODAL (assign/view/edit) */}
      {modalMode && selectedPeriodo && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2 className="modal-title">{modalTitle}</h2>
                <p className="modal-subtitle">{periodoLabel(selectedPeriodo)}</p>
              </div>
              <button className="icon-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            {/* ✅ VIEW (bonito tipo foto 2) */}
            {modalMode === "view" && (
              <div className="modal-body">
                <div className="assign-tools">
                  <input
                    className="input-base"
                    value={periodoSearch}
                    onChange={(e) => setPeriodoSearch(e.target.value)}
                    placeholder="Buscar carrera asignada…"
                  />
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={periodoIncludeInactive}
                      onChange={(e) => setPeriodoIncludeInactive(e.target.checked)}
                    />
                    <span className="slider" />
                    <span className="switch-text">Incluir inactivas</span>
                  </label>
                </div>

                {loading ? (
                  <div className="cpv-empty">Cargando…</div>
                ) : periodoItems.length === 0 ? (
                  <div className="cpv-empty">No hay carreras asignadas.</div>
                ) : (
                  <div className="cpv-grid">
                    {periodoItems.map((x) => {
                      const activo = isActive(x.estado);

                      // vienen “inyectados” cuando abres autoridades (y también pueden venir del backend si ya los incluyes)
                      const director = (x as any).director ?? null;
                      const apoyo = (x as any).apoyo ?? null;

                      return (
                        <div className="cpv-card" key={x.id_carrera_periodo}>
                          <div className="cpv-top">
                            <div className="cpv-left">
                              <div className="cpv-titleRow">
                                <div className="cpv-title">{x.nombre_carrera || "—"}</div>

                                <span className={`cpv-badge ${activo ? "ok" : "bad"}`}>
                                  {activo ? "ACTIVO" : "INACTIVO"}
                                </span>
                              </div>

                              <div className="cpv-meta">{carreraMeta(x) || "—"}</div>
                            </div>

                            <div className="cpv-actions">
                              <button
                                className="cpv-btn cpv-btnGreen"
                                title="Autoridades (Director / Apoyo)"
                                onClick={async () => {
                                  if (!activo) return;

                                  try {
                                    const a = await carreraPeriodoService.getAdmins(x.id_carrera_periodo);
                                    (x as any).director = a.director;
                                    (x as any).apoyo = a.apoyo;
                                  } catch {}

                                  openAutoridadesModal(x);
                                }}
                                disabled={!activo}
                              >
                                <Users size={18} />
                                Autoridades
                              </button>

                              <button
                                className="cpv-btn cpv-btnBlue"
                                title="Franjas"
                                onClick={() => showToast("Conecta aquí Franjas ✅", "info")}
                                disabled={!activo}
                              >
                                Franjas
                              </button>
                            </div>
                          </div>

                          <div className="cpv-divider" />

                          <div className="cpv-admins">
                            <div className="cpv-adminBox">
                              <div className="cpv-k">Director:</div>
                              <div className="cpv-v">{formatAdminLite(director)}</div>
                            </div>

                            <div className="cpv-adminBox">
                              <div className="cpv-k">Docente Apoyo:</div>
                              <div className="cpv-v">{formatAdminLite(apoyo)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="modal-footer">
                  <button className="btn-secondary" onClick={closeModal}>
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* ASSIGN / EDIT */}
            {(modalMode === "assign" || modalMode === "edit") && (
              <form onSubmit={modalMode === "assign" ? onSubmitAssign : onSubmitEdit} className="modal-body">
                <div className="assign-tools">
                  <input
                    className="input-base"
                    value={selectSearch}
                    onChange={(e) => setSelectSearch(e.target.value)}
                    placeholder="Buscar carrera (nombre, código, sede, modalidad)…"
                  />

                  <button type="button" className="btn-secondary" onClick={selectAllVisible}>
                    Seleccionar visibles
                  </button>

                  <button type="button" className="btn-secondary" onClick={clearSelection}>
                    Limpiar
                  </button>

                  <div className="assign-count">
                    Seleccionadas: <b>{selectedCarreraIds.size}</b>
                  </div>
                </div>

                <div className="assign-grid">
                  {carrerasFiltradas.map((c: any) => {
                    const id = Number(c.id_carrera);
                    const checked = selectedCarreraIds.has(id);

                    const yaExiste = carreraAsignadaMap.has(id);
                    const disabledAssign = modalMode === "assign" && yaExiste;

                    return (
                      <label key={id} className={`assign-item ${disabledAssign ? "disabled" : ""}`}>
                        <input type="checkbox" checked={checked} disabled={disabledAssign} onChange={() => toggleSelect(id)} />

                        <div className="assign-text">
                          <div className="assign-name">
                            {c.nombre_carrera}
                            {disabledAssign ? <span className="tag">Ya asignada</span> : null}
                          </div>
                          <div className="assign-meta">{carreraMeta(c) || "—"}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {modalMode === "assign" ? `Asignar (${selectedCarreraIds.size})` : `Guardar (${selectedCarreraIds.size})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ✅ MODAL AUTORIDADES */}
      {showAuthModal && selectedCP && (
        <div className="modalOverlay" onClick={closeAutoridadesModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">Autoridades del período</div>
              <button className="modalClose" onClick={closeAutoridadesModal}>
                ✕
              </button>
            </div>

            <div className="modalBody formStack">
              <div className="muted">
                <b>{selectedCP.nombre_carrera || "Carrera"}</b> — {selectedCP.codigo_periodo || "Período"}
              </div>

              <div className="authCurrent">
                <div className="authBox">
                  <div className="authK">Director actual</div>
                  <div className="authV">{admins ? formatAdminLite(admins.director) : "—"}</div>
                </div>
                <div className="authBox">
                  <div className="authK">Apoyo actual</div>
                  <div className="authV">{admins ? formatAdminLite(admins.apoyo) : "—"}</div>
                </div>
              </div>

              {authLoading ? (
                <div className="muted">Cargando autoridades...</div>
              ) : (
                <>
                  <div className="formField">
                    <label className="label">Director de carrera</label>
                    <select
                      className="fieldSelect"
                      value={dirId}
                      onChange={(e) => setDirId(e.target.value)}
                      disabled={loadingDocentes || authSaving}
                    >
                      <option value="">(Sin asignar)</option>
                      {docentes.map((d: any) => (
                        <option key={d.id_docente} value={d.id_docente}>
                          {d.apellidos_docente} {d.nombres_docente} — {d.nombre_usuario}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="formField">
                    <label className="label">Docente de apoyo</label>
                    <select
                      className="fieldSelect"
                      value={apoId}
                      onChange={(e) => setApoId(e.target.value)}
                      disabled={loadingDocentes || authSaving}
                    >
                      <option value="">(Sin asignar)</option>
                      {docentes.map((d: any) => (
                        <option key={d.id_docente} value={d.id_docente}>
                          {d.apellidos_docente} {d.nombres_docente} — {d.nombre_usuario}
                        </option>
                      ))}
                    </select>
                  </div>

                  {loadingDocentes && <div className="muted">Cargando docentes...</div>}
                </>
              )}
            </div>

            <div className="modalFooter">
              <button className="btnGhost" onClick={closeAutoridadesModal} disabled={authSaving}>
                Cancelar
              </button>

              <button className="btnPrimary" onClick={onSaveAutoridades} disabled={authSaving || authLoading}>
                {authSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
