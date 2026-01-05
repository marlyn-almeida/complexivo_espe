import { useEffect, useMemo, useState } from "react";
import { Search, Users, RefreshCw } from "lucide-react";

import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { docentesService } from "../../services/docentes.service";

import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { Docente } from "../../types/docente";
import type { CarreraPeriodoAdminsResponse } from "../../services/carreraPeriodo.service";

import "./CarreraPeriodoAdminsPage.css";

type ToastType = "success" | "error" | "info";

const PAGE_SIZE = 10;

type AdminRowState = {
  loading: boolean;
  director: CarreraPeriodoAdminsResponse["director"] | null;
  apoyo: CarreraPeriodoAdminsResponse["apoyo"] | null;
  error?: string;
};

export default function CarreraPeriodoAdminsPage() {
  const [items, setItems] = useState<CarreraPeriodo[]>([]);
  const [loading, setLoading] = useState(false);

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loadingDocentes, setLoadingDocentes] = useState(false);

  const [adminsMap, setAdminsMap] = useState<Record<number, AdminRowState>>({});

  const [search, setSearch] = useState("");
  const [mostrarInactivas, setMostrarInactivas] = useState(false);

  const [page, setPage] = useState(1);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCP, setSelectedCP] = useState<CarreraPeriodo | null>(null);

  const [dirId, setDirId] = useState<string>("");
  const [apoId, setApoId] = useState<string>("");

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function cpLabel(cp: CarreraPeriodo) {
    const carrera = cp.nombre_carrera || `Carrera #${cp.id_carrera}`;
    const periodo = cp.codigo_periodo || `Periodo #${cp.id_periodo}`;
    return `${carrera} — ${periodo}`;
  }

  function formatDocenteLite(d?: CarreraPeriodoAdminsResponse["director"] | null) {
    if (!d) return "-";
    return `${d.nombres_docente} ${d.apellidos_docente}`;
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivas]);

  // ✅ si quieres que al escribir busqueda recargue backend, descomenta este effect:
  useEffect(() => {
    // debounce simple
    const t = window.setTimeout(() => {
      loadAll();
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function loadAll() {
    try {
      setLoading(true);
      const data = await carreraPeriodoService.listAll({
        includeInactive: mostrarInactivas,
        q: search,
        page: 1,
        limit: 200,
      });
      setItems(data);
    } catch (err: any) {
      showToast(err?.userMessage || "Error al cargar carreras por período", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => setPage(1), [search, mostrarInactivas]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items
      .filter((x) => (mostrarInactivas ? true : Number(x.estado) === 1))
      .filter((x) => {
        if (!q) return true;
        return (
          (x.nombre_carrera || "").toLowerCase().includes(q) ||
          (x.codigo_carrera || "").toLowerCase().includes(q) ||
          (x.codigo_periodo || "").toLowerCase().includes(q) ||
          (x.sede || "").toLowerCase().includes(q) ||
          (x.modalidad || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.nombre_carrera || "").localeCompare(b.nombre_carrera || "", "es"));
  }, [items, search, mostrarInactivas]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const total = items.length;
  const activas = items.filter((x) => Number(x.estado) === 1).length;
  const inactivas = items.filter((x) => Number(x.estado) === 0).length;

  async function ensureAdminsLoaded(idCarreraPeriodo: number) {
    const current = adminsMap[idCarreraPeriodo];
    if (current?.loading) return;

    setAdminsMap((prev) => ({
      ...prev,
      [idCarreraPeriodo]: {
        loading: true,
        director: current?.director ?? null,
        apoyo: current?.apoyo ?? null,
        error: "",
      },
    }));

    try {
      const data = await carreraPeriodoService.getAdmins(idCarreraPeriodo);
      setAdminsMap((prev) => ({
        ...prev,
        [idCarreraPeriodo]: { loading: false, director: data.director, apoyo: data.apoyo, error: "" },
      }));
    } catch (err: any) {
      setAdminsMap((prev) => ({
        ...prev,
        [idCarreraPeriodo]: {
          loading: false,
          director: null,
          apoyo: null,
          error: err?.userMessage || "Error al cargar asignación",
        },
      }));
    }
  }

  useEffect(() => {
    pageData.forEach((cp) => ensureAdminsLoaded(cp.id_carrera_periodo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData]);

  async function openAssign(cp: CarreraPeriodo) {
    setSelectedCP(cp);

    // cargar docentes (solo una vez)
    if (!docentes.length) {
      try {
        setLoadingDocentes(true);
        const list = await docentesService.list(false);
        setDocentes(list.filter((d) => Number(d.estado) === 1));
      } catch (err: any) {
        showToast(err?.userMessage || "No se pudo cargar docentes", "error");
      } finally {
        setLoadingDocentes(false);
      }
    }

    // ✅ IMPORTANTÍSIMO:
    // No leemos adminsMap inmediatamente porque setState es async.
    // Pedimos admins directamente y seteamos ids de forma segura.
    try {
      setAdminsMap((prev) => ({
        ...prev,
        [cp.id_carrera_periodo]: {
          loading: true,
          director: prev[cp.id_carrera_periodo]?.director ?? null,
          apoyo: prev[cp.id_carrera_periodo]?.apoyo ?? null,
          error: "",
        },
      }));

      const data = await carreraPeriodoService.getAdmins(cp.id_carrera_periodo);

      setAdminsMap((prev) => ({
        ...prev,
        [cp.id_carrera_periodo]: { loading: false, director: data.director, apoyo: data.apoyo, error: "" },
      }));

      setDirId(data.director?.id_docente ? String(data.director.id_docente) : "");
      setApoId(data.apoyo?.id_docente ? String(data.apoyo.id_docente) : "");
    } catch (err: any) {
      setAdminsMap((prev) => ({
        ...prev,
        [cp.id_carrera_periodo]: {
          loading: false,
          director: null,
          apoyo: null,
          error: err?.userMessage || "Error al cargar asignación",
        },
      }));
      setDirId("");
      setApoId("");
      showToast(err?.userMessage || "No se pudo cargar asignación", "error");
    }

    setShowModal(true);
  }

  async function onSaveAdmins() {
    if (!selectedCP) return;

    if (dirId && apoId && dirId === apoId) {
      showToast("Director y Apoyo no pueden ser el mismo docente.", "error");
      return;
    }

    try {
      const payload = {
        id_docente_director: dirId ? Number(dirId) : null,
        id_docente_apoyo: apoId ? Number(apoId) : null,
      };

      const saved = await carreraPeriodoService.setAdmins(selectedCP.id_carrera_periodo, payload);

      setAdminsMap((prev) => ({
        ...prev,
        [selectedCP.id_carrera_periodo]: { loading: false, director: saved.director, apoyo: saved.apoyo, error: "" },
      }));

      showToast("Asignación guardada.", "success");
      setShowModal(false);
    } catch (err: any) {
      showToast(err?.userMessage || "No se pudo guardar la asignación", "error");
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="headerRow">
          <div>
            <h2 className="title">Carreras por Período</h2>
            <p className="subtitle">Asignación de Director de carrera y Docente de apoyo</p>
          </div>

          <button className="btnSecondary" onClick={loadAll} title="Actualizar">
            <RefreshCw size={18} /> Actualizar
          </button>
        </div>

        <div className="summaryRow">
          <div className="summaryBoxes">
            <div className="summaryBox">
              <span className="label">Total</span>
              <span className="value">{total}</span>
            </div>

            <div className="summaryBox active">
              <span className="label">Activas</span>
              <span className="value">{activas}</span>
            </div>

            <div className="summaryBox inactive">
              <span className="label">Inactivas</span>
              <span className="value">{inactivas}</span>
            </div>
          </div>

          <div className="summaryActions">
            <label className="toggle">
              <input
                type="checkbox"
                checked={mostrarInactivas}
                onChange={(e) => setMostrarInactivas(e.target.checked)}
              />
              <span className="slider" />
              <span className="toggleText">Mostrar inactivas</span>
            </label>
          </div>
        </div>

        <div className="filtersRow">
          <div className="searchInline">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar carrera/período..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Carrera</th>
              <th>Período</th>
              <th>Sede</th>
              <th>Modalidad</th>
              <th>Director</th>
              <th>Apoyo</th>
              <th>Estado</th>
              <th className="thActions">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="muted" style={{ padding: 16 }}>
                  Cargando...
                </td>
              </tr>
            ) : pageData.length ? (
              pageData.map((cp) => {
                const st = adminsMap[cp.id_carrera_periodo];
                const loadingAdmins = st?.loading;

                return (
                  <tr key={cp.id_carrera_periodo}>
                    <td className="tdStrong">{cp.nombre_carrera || "-"}</td>
                    <td className="tdCode">{cp.codigo_periodo || "-"}</td>
                    <td>{cp.sede || "-"}</td>
                    <td>{cp.modalidad || "-"}</td>

                    <td>
                      {loadingAdmins ? (
                        <span className="muted">...</span>
                      ) : st?.error ? (
                        <span className="badge badge-danger">Error</span>
                      ) : (
                        <span>{formatDocenteLite(st?.director)}</span>
                      )}
                    </td>

                    <td>
                      {loadingAdmins ? (
                        <span className="muted">...</span>
                      ) : st?.error ? (
                        <span className="badge badge-danger">Error</span>
                      ) : (
                        <span>{formatDocenteLite(st?.apoyo)}</span>
                      )}
                    </td>

                    <td>
                      <span className={`badge ${Number(cp.estado) ? "badge-success" : "badge-danger"}`}>
                        {Number(cp.estado) ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="actions">
                      <button className="btnIcon btnEdit" title="Asignar Director/Apoyo" onClick={() => openAssign(cp)}>
                        <Users size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="muted" style={{ padding: 16 }}>
                  No existen carreras asignadas a períodos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card paginationCard">
        <div className="paginationCenter">
          <button className="btnGhost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </button>

          <span className="muted">
            Página {page} de {totalPages}
          </span>

          <button className="btnGhost" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente →
          </button>
        </div>
      </div>

      {showModal && selectedCP && (
        <div className="modalOverlay">
          <div className="modal">
            <div className="modalHeader">
              <div className="modalTitle">Asignar Director / Apoyo</div>
              <button className="modalClose" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <div className="modalBody formStack">
              <div className="muted" style={{ marginBottom: 10 }}>
                {cpLabel(selectedCP)}
              </div>

              <div className="formField">
                <label className="label">Director de carrera</label>
                <select
                  className="fieldSelect"
                  value={dirId}
                  onChange={(e) => setDirId(e.target.value)}
                  disabled={loadingDocentes}
                >
                  <option value="">(Sin asignar)</option>
                  {docentes.map((d) => (
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
                  disabled={loadingDocentes}
                >
                  <option value="">(Sin asignar)</option>
                  {docentes.map((d) => (
                    <option key={d.id_docente} value={d.id_docente}>
                      {d.apellidos_docente} {d.nombres_docente} — {d.nombre_usuario}
                    </option>
                  ))}
                </select>
              </div>

              {loadingDocentes && <div className="muted">Cargando docentes...</div>}
            </div>

            <div className="modalFooter">
              <button className="btnGhost" onClick={() => setShowModal(false)}>
                Cancelar
              </button>

              <button className="btnPrimary" onClick={onSaveAdmins}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
