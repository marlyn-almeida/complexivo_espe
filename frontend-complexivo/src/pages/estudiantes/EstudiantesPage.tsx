// ✅ src/pages/estudiantes/EstudiantesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Estudiante, Estado01 } from "../../types/estudiante";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";

import { estudiantesService } from "../../services/estudiantes.service";
import { carreraPeriodoService } from "../../services/carreraPeriodo.service";

// ✅ MODALES
import EstudianteFormModal from "./EstudianteFormModal";
import EstudianteViewModal from "./EstudianteViewModal";
import EstudiantesImportModal from "./EstudiantesImportModal";

import {
  Plus,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  Upload,
  Filter,
  X,
  User,
  Mail,
  BadgeCheck,
  BadgeX,
  Pencil,
  GraduationCap,
  CreditCard,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./EstudiantesPage.css";

const PAGE_SIZE = 10;
type ToastType = "success" | "error" | "info";

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D+/g, "");
}

function estado01(v: any): Estado01 {
  return Number(v) === 1 ? 1 : 0;
}

function isActivo(v: any): boolean {
  return estado01(v) === 1;
}

export default function EstudiantesPage() {
  const navigate = useNavigate();

  // ===========================
  // DATA
  // ===========================
  const [carreraPeriodos, setCarreraPeriodos] = useState<CarreraPeriodo[]>([]);
  const [selectedCP, setSelectedCP] = useState<number | "">("");

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(false);

  // ===========================
  // UI
  // ===========================
  const [search, setSearch] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  // ===========================
  // MODALES
  // ===========================
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewEstudiante, setViewEstudiante] = useState<Estudiante | null>(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formEstudiante, setFormEstudiante] = useState<Estudiante | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importingExternal, setImportingExternal] = useState(false);

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
      setEstudiantes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCP, mostrarInactivos]);

  async function loadCarreraPeriodos() {
    try {
      setLoading(true);

      // list(false) => activos
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

      const data = await estudiantesService.list({
        includeInactive: mostrarInactivos,
        carreraPeriodoId: Number(selectedCP),
      });

      setEstudiantes(data ?? []);
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // VIEW / CREATE / EDIT
  // ===========================
  function openView(e: Estudiante) {
    setViewEstudiante(e);
    setShowViewModal(true);
  }

  function closeView() {
    setShowViewModal(false);
    setViewEstudiante(null);
  }

  function openCreate() {
    if (!selectedCP) {
      showToast("Seleccione una Carrera–Período primero.", "error");
      return;
    }
    setFormMode("create");
    setFormEstudiante(null);
    setShowFormModal(true);
  }

  function openEdit(e: Estudiante) {
    setFormMode("edit");
    setFormEstudiante(e);
    setShowFormModal(true);
  }

  function closeFormModal() {
    setShowFormModal(false);
  }

  async function onSavedForm() {
    await loadAll();
    setShowFormModal(false);
  }

  async function onToggleEstado(e: Estudiante) {
    try {
      setLoading(true);

      const current: Estado01 = estado01(e.estado);
      await estudiantesService.toggleEstado(e.id_estudiante, current);

      showToast(current === 1 ? "Estudiante desactivado." : "Estudiante activado.", "success");
      await loadAll();
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // IMPORT MODAL
  // ===========================
  function openImportModal() {
    if (!carreraPeriodos.length) {
      showToast("Primero carga Carrera–Período.", "error");
      return;
    }
    setShowImportModal(true);
  }

  function closeImportModal() {
    if (!importingExternal) setShowImportModal(false);
  }

  // ===========================
  // FILTER + PAGINATION
  // ===========================
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return (estudiantes ?? [])
      .filter((e) => (mostrarInactivos ? true : isActivo(e.estado)))
      .filter((e) => {
        if (!q) return true;

        const ced = onlyDigits(String((e as any).cedula ?? ""));
        const username = String((e as any).nombre_usuario ?? "").toLowerCase();

        return (
          (e.id_institucional_estudiante || "").toLowerCase().includes(q) ||
          ced.toLowerCase().includes(q) ||
          username.includes(q) ||
          (e.nombres_estudiante || "").toLowerCase().includes(q) ||
          (e.apellidos_estudiante || "").toLowerCase().includes(q) ||
          (e.correo_estudiante || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        `${a.apellidos_estudiante || ""} ${a.nombres_estudiante || ""}`.localeCompare(
          `${b.apellidos_estudiante || ""} ${b.nombres_estudiante || ""}`,
          "es"
        )
      );
  }, [estudiantes, search, mostrarInactivos]);

  useEffect(() => setPage(1), [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const total = estudiantes.length;
  const activos = estudiantes.filter((e) => isActivo(e.estado)).length;
  const inactivos = total - activos;

  return (
    <div className="estudiantesPage">
      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Estudiantes</h1>
              <p className="heroSubtitle">
                Gestión de estudiantes por <b>Carrera–Período</b>. Importa desde Excel/CSV y administra el estado.
              </p>

              {selectedCPLabel ? (
                <div className="heroHint">
                  Trabajando en: <b>{selectedCPLabel}</b>
                </div>
              ) : null}
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn ghost" onClick={openImportModal} disabled={loading}>
              <Upload className="heroBtnIcon" />
              Importar
            </button>

            <button className="heroBtn primary" onClick={openCreate} disabled={loading}>
              <Plus className="heroBtnIcon" />
              Nuevo estudiante
            </button>
          </div>
        </div>

        {/* BOX */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <GraduationCap size={18} />
              </span>
              Listado de estudiantes
            </div>

            <div className="boxRight">
              <button className="btnGhost" onClick={loadAll} disabled={loading || !selectedCP} title="Actualizar">
                ⟳ Actualizar
              </button>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
                  disabled={!selectedCP}
                />
                <span className="slider" />
                <span className="toggleText">Mostrar inactivos</span>
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
                <span className="summaryLabel">Activos</span>
                <span className="summaryValue">{activos}</span>
              </div>

              <div className="summaryBox inactive">
                <span className="summaryLabel">Inactivos</span>
                <span className="summaryValue">{inactivos}</span>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="filtersRow">
            <div className="searchWrap">
              <Search className="searchIcon" />
              <input
                className="search"
                placeholder="Buscar por ID institucional, usuario, cédula, nombres, apellidos o correo..."
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
                  <th className="thCenter">
                    <span className="thFlex">
                      <BadgeCheck size={16} /> ID institucional
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <CreditCard size={16} /> Cédula
                    </span>
                  </th>

                  <th className="thCenter thUser">
                    <span className="thFlex">
                      <User size={16} /> Usuario
                    </span>
                  </th>

                  <th className="thName thCenter">
                    <span className="thFlex">
                      <User size={16} /> Estudiante
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <Mail size={16} /> Correo
                    </span>
                  </th>

                  <th className="thState thCenter">
                    <span className="thFlex">
                      <BadgeCheck size={16} /> Estado
                    </span>
                  </th>

                  <th className="thActions thCenter">
                    <span className="thFlex">
                      <Pencil size={16} /> Acciones
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {!selectedCP ? (
                  <tr>
                    <td colSpan={7} className="emptyCell">
                      <div className="empty">Seleccione una Carrera–Período para ver estudiantes.</div>
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={7} className="emptyCell">
                      <div className="empty">Cargando...</div>
                    </td>
                  </tr>
                ) : pageData.length ? (
                  pageData.map((e) => {
                    const activo = isActivo(e.estado);
                    const cedula = onlyDigits(String((e as any).cedula ?? "")) || "-";
                    const username = String((e as any).nombre_usuario ?? "-");

                    return (
                      <tr key={e.id_estudiante}>
                        <td className="tdCenter">
                          <span className="chipCode">{(e.id_institucional_estudiante || "-").toUpperCase()}</span>
                        </td>

                        <td className="mono tdCenter">{cedula}</td>

                        <td className="tdCenter mono">{username}</td>

                        <td className="tdCenter tdName">
                          <div className="nameMain">
                            {e.apellidos_estudiante} {e.nombres_estudiante}
                          </div>
                        </td>

                        <td className="tdCenter mailCell">{e.correo_estudiante || "-"}</td>

                        <td className="tdCenter">
                          {activo ? (
                            <span className="badgeActive">
                              <BadgeCheck className="badgeIcon" size={16} />
                              ACTIVO
                            </span>
                          ) : (
                            <span className="badgeInactive">
                              <BadgeX className="badgeIcon" size={16} />
                              INACTIVO
                            </span>
                          )}
                        </td>

                        <td className="tdActions tdCenter">
                          <div className="actions">
                            <button className="iconBtn iconBtn_neutral" title="Ver" onClick={() => openView(e)}>
                              <Eye className="iconAction" />
                              <span className="tooltip">Ver</span>
                            </button>

                            <button className="iconBtn iconBtn_purple" title="Editar" onClick={() => openEdit(e)}>
                              <Pencil className="iconAction" />
                              <span className="tooltip">Editar</span>
                            </button>

                            <button
                              className={`iconBtn ${activo ? "iconBtn_danger" : "iconBtn_primary"}`}
                              title={activo ? "Desactivar" : "Activar"}
                              onClick={() => onToggleEstado(e)}
                            >
                              {activo ? <ToggleRight className="iconAction" /> : <ToggleLeft className="iconAction" />}
                              <span className="tooltip">{activo ? "Desactivar" : "Activar"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="emptyCell">
                      <div className="empty">No hay estudiantes para mostrar.</div>
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
        <EstudianteFormModal
          mode={formMode}
          estudiante={formEstudiante}
          carreraPeriodos={carreraPeriodos}
          selectedCarreraPeriodoId={selectedCP ? Number(selectedCP) : undefined}
          onClose={closeFormModal}
          onSaved={onSavedForm}
          onToast={showToast}
        />
      )}

      {showViewModal && viewEstudiante && (
        <EstudianteViewModal estudiante={viewEstudiante} selectedCPLabel={selectedCPLabel} onClose={closeView} />
      )}

      <EstudiantesImportModal
        open={showImportModal}
        carreraPeriodos={carreraPeriodos}
        importingExternal={importingExternal}
        setImportingExternal={setImportingExternal}
        onClose={closeImportModal}
        onToast={(msg, type) => showToast(msg, type ?? "info")}
        onImported={async () => {
          if (selectedCP) await loadAll();
        }}
      />

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
