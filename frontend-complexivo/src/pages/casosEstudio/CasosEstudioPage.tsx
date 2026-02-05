import { useEffect, useMemo, useState } from "react";

import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { CasoEstudio } from "../../types/casoEstudio";

import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { casosEstudioService } from "../../services/casosEstudio.service";

// ✅ MODALES
import CasoEstudioFormModal from "./CasoEstudioFormModal";
import CasoEstudioViewModal from "./CasoEstudioViewModal";

import {
  Plus,
  Eye,
  Search,
  Filter,
  X,
  FileText,
  BadgeCheck,
  Download,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./CasosEstudioPage.css";

const PAGE_SIZE = 10;
type ToastType = "success" | "error" | "info";

export default function CasosEstudioPage() {
  // ===========================
  // DATA
  // ===========================
  const [carreraPeriodos, setCarreraPeriodos] = useState<CarreraPeriodo[]>([]);
  const [selectedCP, setSelectedCP] = useState<number | "">("");

  const [casos, setCasos] = useState<CasoEstudio[]>([]);
  const [loading, setLoading] = useState(false);

  // ===========================
  // UI
  // ===========================
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  // ===========================
  // MODALES
  // ===========================
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewItem, setViewItem] = useState<CasoEstudio | null>(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formItem, setFormItem] = useState<CasoEstudio | null>(null);

  // ===========================
  // HELPERS
  // ===========================
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;

    if (Array.isArray(list) && list.length) {
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;

    return "Ocurrió un error";
  }

  const selectedCPLabel = useMemo(() => {
    const cp = carreraPeriodos.find((x: any) => x.id_carrera_periodo === selectedCP);
    if (!cp) return "";
    const carrera = (cp as any).nombre_carrera ?? "Carrera";
    const periodo = (cp as any).codigo_periodo ?? (cp as any).descripcion_periodo ?? "Período";
    return `${carrera} — ${periodo}`;
  }, [carreraPeriodos, selectedCP]);

  // ===========================
  // LOAD
  // ===========================
  useEffect(() => {
    loadCarreraPeriodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCP) {
      loadAll();
      setPage(1);
    } else {
      setCasos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCP]);

  async function loadCarreraPeriodos() {
    try {
      setLoading(true);

      const cps = await carreraPeriodoService.list(false);
      setCarreraPeriodos(cps ?? []);

      const first = (cps ?? []).find((x: any) => Boolean((x as any).estado)) ?? (cps ?? [])[0];
      if (first) setSelectedCP((first as any).id_carrera_periodo);
      else setSelectedCP("");
    } catch {
      showToast("Error al cargar Carrera–Período", "error");
      setCarreraPeriodos([]);
      setSelectedCP("");
    } finally {
      setLoading(false);
    }
  }

  async function loadAll() {
    if (!selectedCP) return;

    try {
      setLoading(true);

      const data = await casosEstudioService.list({
        carreraPeriodoId: Number(selectedCP),
      });

      setCasos(data ?? []);
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
      setCasos([]);
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // VIEW / CREATE / EDIT
  // ===========================
  function openView(item: CasoEstudio) {
    setViewItem(item);
    setShowViewModal(true);
  }

  function closeView() {
    setShowViewModal(false);
    setViewItem(null);
  }

  function openCreate() {
    if (!selectedCP) {
      showToast("Seleccione una Carrera–Período primero.", "error");
      return;
    }
    setFormMode("create");
    setFormItem(null);
    setShowFormModal(true);
  }

  function openEdit(item: CasoEstudio) {
    setFormMode("edit");
    setFormItem(item);
    setShowFormModal(true);
  }

  function closeFormModal() {
    setShowFormModal(false);
  }

  async function onSavedForm() {
    await loadAll();
    setShowFormModal(false);
  }

  // ===========================
  // FILTER + PAGINATION
  // ===========================
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return (casos ?? [])
      .filter((x) => {
        if (!q) return true;
        const t = `${x.numero_caso} ${x.titulo ?? ""} ${x.descripcion ?? ""} ${x.archivo_nombre ?? ""}`.toLowerCase();
        return t.includes(q);
      })
      .sort((a, b) => Number(a.numero_caso) - Number(b.numero_caso));
  }, [casos, search]);

  useEffect(() => setPage(1), [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const total = casos.length;

  return (
    <div className="casosEstudioPage">
      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Casos de Estudio</h1>
              <p className="heroSubtitle">
                Crea y administra los casos (PDF oficial) por <b>Carrera–Período</b>.
              </p>

              {selectedCPLabel ? (
                <div className="heroHint">
                  Trabajando en: <b>{selectedCPLabel}</b>
                </div>
              ) : null}
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn ghost" onClick={loadAll} disabled={loading || !selectedCP}>
              ⟳ Actualizar
            </button>

            <button className="heroBtn primary" onClick={openCreate} disabled={loading}>
              <Plus className="heroBtnIcon" />
              Nuevo caso
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
              Listado de casos
            </div>

            <div className="boxRight">
              <div className="summaryBoxes">
                <div className="summaryBox">
                  <span className="summaryLabel">Total</span>
                  <span className="summaryValue">{total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="filtersRow">
            <div className="searchWrap">
              <Search className="searchIcon" />
              <input
                className="search"
                placeholder="Buscar por número, título, descripción o archivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!selectedCP}
              />
            </div>

            <div className="filterWrap">
              <Filter className="filterIcon" />
              <select
                className="select"
                value={selectedCP}
                onChange={(e) => setSelectedCP(e.target.value ? Number(e.target.value) : "")}
                disabled={loading}
                title="Seleccione Carrera–Período"
              >
                <option value="">Seleccione Carrera–Período</option>
                {carreraPeriodos.map((cp: any) => {
                  const carrera = cp.nombre_carrera ?? `Carrera ${cp.id_carrera}`;
                  const periodo = cp.codigo_periodo ?? cp.descripcion_periodo ?? `Período ${cp.id_periodo}`;
                  return (
                    <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                      {carrera} — {periodo}
                    </option>
                  );
                })}
              </select>

              {selectedCP && (
                <button className="chipClear" onClick={() => setSelectedCP("")} title="Quitar filtro">
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
                  <th className="thCenter" style={{ width: 160 }}>
                    <span className="thFlex">
                      <BadgeCheck size={16} /> N° Caso
                    </span>
                  </th>

                  <th className="thCenter" style={{ width: 360 }}>
                    <span className="thFlex">
                      <FileText size={16} /> Título
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <FileText size={16} /> Descripción
                    </span>
                  </th>

                  <th className="thCenter" style={{ width: 260 }}>
                    <span className="thFlex">
                      <FileText size={16} /> Archivo
                    </span>
                  </th>

                  <th className="thActions thCenter" style={{ width: 220 }}>
                    <span className="thFlex">
                      <FileText size={16} /> Acciones
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {!selectedCP ? (
                  <tr>
                    <td colSpan={5} className="emptyCell">
                      <div className="empty">Seleccione una Carrera–Período para ver casos.</div>
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={5} className="emptyCell">
                      <div className="empty">Cargando...</div>
                    </td>
                  </tr>
                ) : pageData.length ? (
                  pageData.map((x) => (
                    <tr key={x.id_caso_estudio}>
                      <td className="tdCenter">
                        <span className="chipCode">CASO {x.numero_caso}</span>
                      </td>

                      <td className="tdCenter tdName">
                        <div className="nameMain">{x.titulo || "-"}</div>
                      </td>

                      <td className="tdCenter">{x.descripcion || "-"}</td>

                      <td className="tdCenter mailCell" title={x.archivo_nombre}>
                        {x.archivo_nombre}
                      </td>

                      <td className="tdActions tdCenter">
                        <div className="actions">
                          <button className="iconBtn iconBtn_neutral" title="Ver" onClick={() => openView(x)}>
                            <Eye className="iconAction" />
                            <span className="tooltip">Ver</span>
                          </button>

                          <a
                            className="iconBtn iconBtn_primary"
                            title="Descargar"
                            href={x.archivo_path}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="iconAction" />
                            <span className="tooltip">Descargar</span>
                          </a>

                          <button className="iconBtn iconBtn_purple" title="Editar" onClick={() => openEdit(x)}>
                            ✎
                            <span className="tooltip">Editar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="emptyCell">
                      <div className="empty">No hay casos para mostrar.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="paginationRow">
            <button className="btnGhost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ← Anterior
            </button>

            <span className="paginationText">
              Página {page} de {totalPages}
            </span>

            <button className="btnGhost" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {/* ✅ MODALES */}
      {showFormModal && (
        <CasoEstudioFormModal
          mode={formMode}
          caso={formItem}
          selectedCarreraPeriodoId={selectedCP ? Number(selectedCP) : undefined}
          onClose={closeFormModal}
          onSaved={onSavedForm}
          onToast={showToast}
        />
      )}

      {showViewModal && viewItem && (
        <CasoEstudioViewModal
          caso={viewItem}
          selectedCPLabel={selectedCPLabel}
          onClose={closeView}
        />
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
