import { useEffect, useMemo, useState, type FormEvent } from "react";
import "./CarreraPeriodoPage.css";

import type { Carrera } from "../../types/carrera";
import type { CarreraPeriodo, PeriodoResumen } from "../../types/carreraPeriodo";
import { carrerasService } from "../../services/carreras.service";
import { carreraPeriodoService } from "../../services/carreraPeriodo.service";

const PAGE_SIZE = 10;

const toYMD = (v: any) => (v ? String(v).slice(0, 10) : "");
const isActive = (estado: boolean | number) => (typeof estado === "boolean" ? estado : estado === 1);

function periodoLabel(p: any) {
  const codigo = p.codigo_periodo ?? "";
  const desc = p.descripcion_periodo ?? "";
  const fi = toYMD(p.fecha_inicio);
  const ff = toYMD(p.fecha_fin);
  const base = [codigo, desc].filter(Boolean).join(" · ");
  const rango = fi && ff ? ` (${fi} → ${ff})` : "";
  return (base || `Período #${p.id_periodo}`) + rango;
}

export default function CarreraPeriodoPage() {
  const [loading, setLoading] = useState(false);

  // base
  const [carreras, setCarreras] = useState<Carrera[]>([]);

  // tabla principal (periodos)
  const [periodos, setPeriodos] = useState<PeriodoResumen[]>([]);
  const [qPeriodos, setQPeriodos] = useState("");
  const [includeInactiveCount, setIncludeInactiveCount] = useState(false);

  // paginación tabla principal
  const [page, setPage] = useState(1);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(periodos.length / PAGE_SIZE)), [periodos.length]);
  const pagedPeriodos = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return periodos.slice(start, start + PAGE_SIZE);
  }, [periodos, page]);

  // modal state
  const [modalMode, setModalMode] = useState<null | "assign" | "edit" | "view">(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodoResumen | null>(null);

  // datos del periodo (carreras asignadas)
  const [periodoItems, setPeriodoItems] = useState<CarreraPeriodo[]>([]);
  const [periodoSearch, setPeriodoSearch] = useState("");
  const [periodoIncludeInactive, setPeriodoIncludeInactive] = useState(true);

  // selección en modal (bloques)
  const [selectSearch, setSelectSearch] = useState("");
  const [selectedCarreraIds, setSelectedCarreraIds] = useState<Set<number>>(new Set());

  const carrerasSorted = useMemo(() => {
    const arr = [...carreras];
    arr.sort((a: any, b: any) => String(a.nombre_carrera).localeCompare(String(b.nombre_carrera)));
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

  const carreraAsignadaMap = useMemo(() => {
    const m = new Map<number, CarreraPeriodo>();
    periodoItems.forEach((x) => m.set(x.id_carrera, x));
    return m;
  }, [periodoItems]);

  const fetchBase = async () => {
    setLoading(true);
    try {
      const cs = await carrerasService.list();
      setCarreras(cs ?? []);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumen = async () => {
    setLoading(true);
    try {
      const data = await carreraPeriodoService.resumen({
        includeInactive: includeInactiveCount,
        q: qPeriodos,
      });
      setPeriodos(data ?? []);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodoItems = async (periodoId: number) => {
    setLoading(true);
    try {
      const data = await carreraPeriodoService.listByPeriodo(periodoId, {
        includeInactive: periodoIncludeInactive,
        q: periodoSearch,
      });
      setPeriodoItems(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBase();
    fetchResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qPeriodos, includeInactiveCount]);

  // refetch dentro de modal cuando cambian filtros
  useEffect(() => {
    if (!selectedPeriodo) return;
    if (modalMode === "view" || modalMode === "edit") {
      fetchPeriodoItems(selectedPeriodo.id_periodo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoSearch, periodoIncludeInactive]);

  const openModal = async (mode: "assign" | "edit" | "view", p: PeriodoResumen) => {
    setSelectedPeriodo(p);
    setModalMode(mode);

    setPeriodoSearch("");
    setPeriodoIncludeInactive(true);
    setSelectSearch("");

    if (mode === "assign") {
      // asignar: NO preselecciona, pero sí necesitamos saber qué ya está asignado para bloquear “ya asignada”
      const items = await carreraPeriodoService.listByPeriodo(p.id_periodo, { includeInactive: true });
      setPeriodoItems(items ?? []);
      setSelectedCarreraIds(new Set()); // vacío
    }

    if (mode === "view") {
      const items = await carreraPeriodoService.listByPeriodo(p.id_periodo, { includeInactive: true });
      setPeriodoItems(items ?? []);
      setSelectedCarreraIds(new Set());
    }

    if (mode === "edit") {
      // editar: preselecciona las activas actuales (para poder deseleccionar)
      const items = await carreraPeriodoService.listByPeriodo(p.id_periodo, { includeInactive: true });
      setPeriodoItems(items ?? []);

      const activeIds = new Set<number>();
      (items ?? []).forEach((x) => {
        if (isActive(x.estado)) activeIds.add(x.id_carrera);
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
  };

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
      const items = await carreraPeriodoService.listByPeriodo(selectedPeriodo.id_periodo, { includeInactive: true });
      setPeriodoItems(items ?? []);
      closeModal();
    } catch {
      alert("No se pudo asignar carreras. Revisa backend/consola.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodo) return;

    const ids = Array.from(selectedCarreraIds); // puede ser vacío (deja todo inactivo)

    setLoading(true);
    try {
      await carreraPeriodoService.sync({
        id_periodo: selectedPeriodo.id_periodo,
        carreraIds: ids,
      });

      await fetchResumen();
      const items = await carreraPeriodoService.listByPeriodo(selectedPeriodo.id_periodo, { includeInactive: true });
      setPeriodoItems(items ?? []);
      closeModal();
    } catch {
      alert("No se pudo editar (sync). Revisa backend/consola.");
    } finally {
      setLoading(false);
    }
  };

  const modalTitle =
    modalMode === "assign" ? "Asignar carreras" : modalMode === "edit" ? "Editar carreras del período" : "Ver carreras asignadas";

  return (
    <div className="cp3-page">
      <div className="cp3-panel">
        <div className="cp3-panel-top">
          <div>
            <h1 className="cp3-title">Carrera – Período</h1>
            <p className="cp3-subtitle">
              La tabla principal muestra períodos. En acciones puedes asignar, ver o editar carreras por período.
            </p>
          </div>
        </div>

        <div className="cp3-filters">
          <input
            className="input-base"
            value={qPeriodos}
            onChange={(e) => setQPeriodos(e.target.value)}
            placeholder="Buscar por código o descripción del período…"
          />

          <label className="switch">
            <input
              type="checkbox"
              checked={includeInactiveCount}
              onChange={(e) => setIncludeInactiveCount(e.target.checked)}
            />
            <span className="slider" />
            <span className="switch-text">Contar inactivas</span>
          </label>
        </div>
      </div>

      <div className="cp3-card">
        <div className="cp3-table-scroll">
          <table className="cp3-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Rango</th>
                <th># Carreras</th>
                <th className="cp3-actions-col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="td-center">Cargando…</td>
                </tr>
              ) : pagedPeriodos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="td-center">Sin períodos</td>
                </tr>
              ) : (
                pagedPeriodos.map((p) => {
                  const rango = `${toYMD(p.fecha_inicio)} → ${toYMD(p.fecha_fin)}`;
                  return (
                    <tr key={p.id_periodo}>
                      <td className="td-strong">
                        {(p.codigo_periodo || "—")}
                        <div className="td-mini">{p.descripcion_periodo || ""}</div>
                      </td>
                      <td className="td-muted">{rango}</td>
                      <td>
                        <span className="count-pill">{Number(p.total_asignadas || 0)}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn-action assign" onClick={() => openModal("assign", p)}>
                            Asignar
                          </button>
                          <button className="btn-action view" onClick={() => openModal("view", p)}>
                            Ver
                          </button>
                          <button className="btn-action edit" onClick={() => openModal("edit", p)}>
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="cp3-pagination">
          <button className="btn-page" onClick={() => setPage((x) => Math.max(1, x - 1))} disabled={page <= 1}>
            ◀
          </button>
          <span className="page-info">
            Página <b>{page}</b> de <b>{pageCount}</b>
          </span>
          <button className="btn-page" onClick={() => setPage((x) => Math.min(pageCount, x + 1))} disabled={page >= pageCount}>
            ▶
          </button>
        </div>
      </div>

      {/* MODAL */}
      {modalMode && selectedPeriodo && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2 className="modal-title">{modalTitle}</h2>
                <p className="modal-subtitle">{periodoLabel(selectedPeriodo)}</p>
              </div>
              <button className="icon-btn" onClick={closeModal}>✕</button>
            </div>

            {/* VIEW */}
            {modalMode === "view" && (
              <div className="modal-body">
                {loading ? (
                  <div className="td-center">Cargando…</div>
                ) : periodoItems.length === 0 ? (
                  <div className="td-center">No hay carreras asignadas.</div>
                ) : (
                  <div className="view-list">
                    {periodoItems.map((x) => {
                      const activo = isActive(x.estado);
                      const meta = [x.codigo_carrera, x.modalidad, x.sede].filter(Boolean).join(" · ");
                      return (
                        <div className="view-item" key={x.id_carrera_periodo}>
                          <div>
                            <div className="view-name">{x.nombre_carrera}</div>
                            <div className="view-meta">{meta || "—"}</div>
                          </div>
                          <span className={`badge ${activo ? "active" : "inactive"}`}>
                            {activo ? "ACTIVO" : "INACTIVO"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="modal-footer">
                  <button className="btn-secondary" onClick={closeModal}>Cerrar</button>
                </div>
              </div>
            )}

            {/* ASSIGN / EDIT (grid) */}
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

                    // En "assign" bloqueamos las ya asignadas (para que no se confunda)
                    const yaExiste = carreraAsignadaMap.has(id);
                    const disabledAssign = modalMode === "assign" && yaExiste;

                    const meta = [c.codigo_carrera, c.modalidad, c.sede].filter(Boolean).join(" · ");

                    return (
                      <label key={id} className={`assign-item ${disabledAssign ? "disabled" : ""}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabledAssign}
                          onChange={() => toggleSelect(id)}
                        />
                        <div className="assign-text">
                          <div className="assign-name">
                            {c.nombre_carrera}
                            {disabledAssign ? <span className="tag">Ya asignada</span> : null}
                          </div>
                          <div className="assign-meta">{meta || "—"}</div>
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
                    {modalMode === "assign" ? `Asignar (${selectedCarreraIds.size})` : `Guardar cambios (${selectedCarreraIds.size})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
