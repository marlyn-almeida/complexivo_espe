// ✅ src/pages/estudiantes/EstudiantesPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { Estudiante, Estado01 } from "../../types/estudiante";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";

import { estudiantesService } from "../../services/estudiantes.service";
import { carreraPeriodoService } from "../../services/carreraPeriodo.service";

import {
  downloadPlantillaEstudiantesCSV,
  parseExcelEstudiantes,
  resolveCarreraPeriodoIdByNombreCarreraCodigoPeriodo,
} from "../../services/estudiantesImport.service";

import {
  Plus,
  Pencil,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  Upload,
  Download,
  X,
  Filter,
  Hash,
  Mail,
  User,
  BadgeCheck,
  BadgeX,
  GraduationCap,
  FileSpreadsheet,
  Info,
  CreditCard,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./EstudiantesPage.css";

const PAGE_SIZE = 10;
type ToastType = "success" | "error" | "info";

type EstudianteFormState = {
  id_carrera_periodo: number | "";
  id_institucional_estudiante: string;

  // ✅ NUEVO
  cedula: string;

  nombres_estudiante: string;
  apellidos_estudiante: string;
  correo_estudiante: string;
  telefono_estudiante: string;
};

export default function EstudiantesPage() {
  // ===========================
  // ESTADOS PRINCIPALES
  // ===========================
  const [carreraPeriodos, setCarreraPeriodos] = useState<CarreraPeriodo[]>([]);
  const [selectedCP, setSelectedCP] = useState<number | "">("");

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(false);

  // ===========================
  // FILTROS
  // ===========================
  const [search, setSearch] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // ===========================
  // PAGINACIÓN
  // ===========================
  const [page, setPage] = useState(1);

  // ===========================
  // MODALES
  // ===========================
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null);
  const [viewEstudiante, setViewEstudiante] = useState<Estudiante | null>(null);

  // ===========================
  // IMPORT
  // ===========================
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ===========================
  // FORM
  // ===========================
  const [form, setForm] = useState<EstudianteFormState>({
    id_carrera_periodo: "",
    id_institucional_estudiante: "",
    cedula: "",
    nombres_estudiante: "",
    apellidos_estudiante: "",
    correo_estudiante: "",
    telefono_estudiante: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  // ===========================
  // HELPERS
  // ===========================
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  // ✅ Normaliza estado: soporta 1/0, "1"/"0", true/false
  function estado01(v: any): 0 | 1 {
    return Number(v) === 1 ? 1 : 0;
  }
  function isActivo(v: any): boolean {
    return estado01(v) === 1;
  }

  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;

    if (Array.isArray(list) && list.length) {
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;

    return "Error al guardar estudiante";
  }

  const selectedCPLabel = useMemo(() => {
    const cp = carreraPeriodos.find((x: any) => x.id_carrera_periodo === selectedCP);
    if (!cp) return "";
    const carrera = (cp as any).nombre_carrera ?? "Carrera";
    const periodo = (cp as any).codigo_periodo ?? (cp as any).descripcion_periodo ?? "Período";
    return `${carrera} — ${periodo}`;
  }, [carreraPeriodos, selectedCP]);

  // ===========================
  // CARGA INICIAL
  // ===========================
  useEffect(() => {
    loadCarreraPeriodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCP) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCP, mostrarInactivos]);

  async function loadCarreraPeriodos() {
    try {
      setLoading(true);

      const cps = await carreraPeriodoService.list(false);

      setCarreraPeriodos(cps);

      const first = cps.find((x) => Boolean((x as any).estado)) ?? cps[0];
      if (first) setSelectedCP((first as any).id_carrera_periodo);
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
        q: search.trim() || undefined,
        page: 1,
        limit: 100,
      });
      setEstudiantes(data);
    } catch {
      showToast("Error al cargar estudiantes", "error");
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // CREATE / EDIT / VIEW
  // ===========================
  function resetForm() {
    setEditingEstudiante(null);
    setForm({
      id_carrera_periodo: selectedCP || "",
      id_institucional_estudiante: "",
      cedula: "",
      nombres_estudiante: "",
      apellidos_estudiante: "",
      correo_estudiante: "",
      telefono_estudiante: "",
    });
    setErrors({});
  }

  function openCreate() {
    if (!selectedCP) {
      showToast("Seleccione una Carrera–Período primero.", "error");
      return;
    }
    resetForm();
    setShowFormModal(true);
  }

  function openEdit(e: Estudiante) {
    setEditingEstudiante(e);
    setForm({
      id_carrera_periodo: e.id_carrera_periodo,
      id_institucional_estudiante: e.id_institucional_estudiante ?? "",
      cedula: (e as any).cedula ?? "",
      nombres_estudiante: e.nombres_estudiante ?? "",
      apellidos_estudiante: e.apellidos_estudiante ?? "",
      correo_estudiante: e.correo_estudiante ?? "",
      telefono_estudiante: e.telefono_estudiante ?? "",
    });
    setErrors({});
    setShowFormModal(true);
  }

  function closeForm() {
    setShowFormModal(false);
    setEditingEstudiante(null);
  }

  function openView(e: Estudiante) {
    setViewEstudiante(e);
    setShowViewModal(true);
  }

  function closeView() {
    setShowViewModal(false);
    setViewEstudiante(null);
  }

  // ===========================
  // VALIDACIONES FRONT
  // ===========================
  function validateForm(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!form.id_carrera_periodo) e.id_carrera_periodo = "Seleccione Carrera–Período.";
    if (!form.id_institucional_estudiante.trim()) e.id_institucional_estudiante = "ID institucional obligatorio.";

    // ✅ cédula obligatoria: solo números + mínimo 10
    const ced = form.cedula.trim();
    if (!ced) e.cedula = "Cédula obligatoria.";
    else {
      if (!/^\d+$/.test(ced)) e.cedula = "La cédula solo debe contener números.";
      else if (ced.length < 10) e.cedula = "La cédula debe tener al menos 10 dígitos.";
    }

    if (!form.nombres_estudiante.trim()) e.nombres_estudiante = "Nombres obligatorios.";
    if (form.nombres_estudiante.trim().length < 3) e.nombres_estudiante = "Mínimo 3 caracteres.";

    if (!form.apellidos_estudiante.trim()) e.apellidos_estudiante = "Apellidos obligatorios.";
    if (form.apellidos_estudiante.trim().length < 3) e.apellidos_estudiante = "Mínimo 3 caracteres.";

    if (form.correo_estudiante.trim() && !/^\S+@\S+\.\S+$/.test(form.correo_estudiante.trim())) {
      e.correo_estudiante = "Correo no válido.";
    }

    return e;
  }

  async function onSave() {
    const e = validateForm();
    setErrors(e);

    if (Object.keys(e).length) {
      showToast("Revisa los campos obligatorios.", "error");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        id_carrera_periodo: Number(form.id_carrera_periodo),
        id_institucional_estudiante: form.id_institucional_estudiante.trim(),
        cedula: form.cedula.trim(),
        nombres_estudiante: form.nombres_estudiante.trim(),
        apellidos_estudiante: form.apellidos_estudiante.trim(),
        correo_estudiante: form.correo_estudiante.trim() ? form.correo_estudiante.trim() : undefined,
        telefono_estudiante: form.telefono_estudiante.trim() ? form.telefono_estudiante.trim() : undefined,
      };

      if (editingEstudiante) {
        await estudiantesService.update(editingEstudiante.id_estudiante, payload as any);
        showToast("Estudiante actualizado.", "success");
      } else {
        await estudiantesService.create(payload as any);
        showToast("Estudiante creado.", "success");
      }

      setShowFormModal(false);
      await loadAll();
    } catch (err: any) {
      showToast(extractBackendError(err), "error");

      const list = err?.response?.data?.errors;
      if (Array.isArray(list)) {
        const mapped: Record<string, string> = {};
        for (const it of list) {
          if (it?.path && it?.msg) mapped[String(it.path)] = String(it.msg);
          if (it?.param && it?.msg) mapped[String(it.param)] = String(it.msg);
        }
        if (Object.keys(mapped).length) setErrors((prev) => ({ ...prev, ...mapped }));
      }
    } finally {
      setLoading(false);
    }
  }

  async function onToggleEstado(e: Estudiante) {
    try {
      setLoading(true);

      const current: Estado01 = estado01(e.estado) as Estado01;
      await estudiantesService.toggleEstado(e.id_estudiante, current);

      showToast(current === 1 ? "Estudiante desactivado." : "Estudiante activado.", "success");
      await loadAll();
    } catch {
      showToast("No se pudo cambiar el estado.", "error");
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // IMPORTACIÓN EXCEL (modal)
  // ===========================
  function openImport() {
    if (!carreraPeriodos.length) {
      showToast("Primero carga Carrera–Período.", "error");
      return;
    }
    setShowImportModal(true);
  }

  function closeImport() {
    if (!importing) setShowImportModal(false);
  }

  function onPickFile() {
    fileInputRef.current?.click();
  }

  async function onFileSelected(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;

    try {
      setImporting(true);
      setLoading(true);

      const rows = await parseExcelEstudiantes(file);

      const payloads = rows.map((r) => {
        const idCP = resolveCarreraPeriodoIdByNombreCarreraCodigoPeriodo(
          r.__nombre_carrera,
          r.__codigo_periodo,
          carreraPeriodos
        );

        if (!idCP) {
          throw new Error(
            `Fila ${r.__rowNumber}: No existe Carrera–Período para (Carrera="${r.__nombre_carrera}", Periodo="${r.__codigo_periodo}").`
          );
        }

        return {
          id_carrera_periodo: idCP,
          id_institucional_estudiante: r.id_institucional_estudiante,
          // ✅ NUEVO
          cedula: (r as any).cedula,
          nombres_estudiante: r.nombres_estudiante,
          apellidos_estudiante: r.apellidos_estudiante,
          correo_estudiante: r.correo_estudiante,
          telefono_estudiante: r.telefono_estudiante,
        };
      });

      if (!payloads.length) {
        showToast("No hay filas válidas para importar.", "error");
        return;
      }

      let ok = 0;
      for (const p of payloads) {
        // ✅ validación rápida por si el excel viene mal
        const ced = String((p as any).cedula ?? "").trim();
        if (!ced || !/^\d+$/.test(ced) || ced.length < 10) {
          throw new Error(`Error de importación: cédula inválida en ID institucional "${p.id_institucional_estudiante}".`);
        }

        await estudiantesService.create(p as any);
        ok++;
      }

      showToast(`Importación completada: ${ok} estudiante(s) creados.`, "success");
      setShowImportModal(false);

      if (selectedCP) await loadAll();
    } catch (err: any) {
      showToast(err?.message || "Error al importar estudiantes", "error");
    } finally {
      setImporting(false);
      setLoading(false);
    }
  }

  // ===========================
  // FILTRADO + ORDEN + PAGINACIÓN
  // ===========================
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return estudiantes
      .filter((e) => (mostrarInactivos ? true : isActivo(e.estado)))
      .filter((e) => {
        if (!q) return true;
        return (
          (e.id_institucional_estudiante || "").toLowerCase().includes(q) ||
          ((e as any).cedula || "").toLowerCase().includes(q) ||
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

  useEffect(() => setPage(1), [search, mostrarInactivos, selectedCP]);

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
            <button className="heroBtn ghost" onClick={openImport} disabled={loading}>
              <Upload className="heroBtnIcon" />
              Importar
            </button>

            <button className="heroBtn ghost" onClick={downloadPlantillaEstudiantesCSV} disabled={loading}>
              <Download className="heroBtnIcon" />
              Plantilla
            </button>

            <button className="heroBtn primary" onClick={openCreate} disabled={loading}>
              <Plus className="heroBtnIcon" />
              Nuevo estudiante
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={onFileSelected}
            />
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
              <button className="btnGhost" onClick={loadAll} disabled={loading} title="Actualizar">
                ⟳ Actualizar
              </button>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(ev) => setMostrarInactivos(ev.target.checked)}
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
                placeholder="Buscar por ID institucional, cédula, nombres, apellidos o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filterWrap">
              <Filter className="filterIcon" />
              <select
                className={`select ${errors.id_carrera_periodo ? "input-error" : ""}`}
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

                  {/* ✅ NUEVO */}
                  <th className="thCenter">
                    <span className="thFlex">
                      <CreditCard size={16} /> Cédula
                    </span>
                  </th>

                  <th className="thCenter">
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="emptyCell">
                      <div className="empty">Cargando...</div>
                    </td>
                  </tr>
                ) : pageData.length ? (
                  pageData.map((e) => {
                    const activo = isActivo(e.estado);
                    const cedula = (e as any).cedula ?? "-";

                    return (
                      <tr key={e.id_estudiante}>
                        <td className="tdCenter">
                          <span className="chipCode">{(e.id_institucional_estudiante || "-").toUpperCase()}</span>
                        </td>

                        {/* ✅ NUEVO */}
                        <td className="tdCenter">
                          <span className="chipCode">{String(cedula)}</span>
                        </td>

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

                            <button className="iconBtn iconBtn_primary" title="Editar" onClick={() => openEdit(e)}>
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
                    <td colSpan={6} className="emptyCell">
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

      {/* ===========================
          MODAL: FORM
          =========================== */}
      {showFormModal && (
        <div className="modalOverlay" onMouseDown={closeForm}>
          <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalHeaderLeft">
                <div className="modalHeaderIcon">
                  <User size={18} />
                </div>
                <div>
                  <div className="modalHeaderTitle">{editingEstudiante ? "Editar Estudiante" : "Nuevo Estudiante"}</div>
                  <div className="modalHeaderSub">Complete la información requerida</div>
                </div>
              </div>

              <button className="modalClose" onClick={closeForm} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="modalDivider" />

            <div className="modalBody">
              <div className="formGrid">
                <div className="formField full">
                  <label className="fLabel">Carrera–Período *</label>
                  <select
                    className={`input ${errors.id_carrera_periodo ? "input-error" : ""}`}
                    value={form.id_carrera_periodo}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, id_carrera_periodo: e.target.value ? Number(e.target.value) : "" }))
                    }
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
                  {errors.id_carrera_periodo && <div className="field-error">{errors.id_carrera_periodo}</div>}
                </div>

                <div className="formField">
                  <label className="fLabel">ID institucional *</label>
                  <input
                    className={`input ${errors.id_institucional_estudiante ? "input-error" : ""}`}
                    value={form.id_institucional_estudiante}
                    onChange={(e) => setForm((p) => ({ ...p, id_institucional_estudiante: e.target.value }))}
                  />
                  {errors.id_institucional_estudiante && (
                    <div className="field-error">{errors.id_institucional_estudiante}</div>
                  )}
                </div>

                {/* ✅ NUEVO */}
                <div className="formField">
                  <label className="fLabel">Cédula *</label>
                  <input
                    className={`input ${errors.cedula ? "input-error" : ""}`}
                    value={form.cedula}
                    onChange={(e) => {
                      // opcional: permitir solo dígitos al escribir
                      const onlyDigits = e.target.value.replace(/[^\d]/g, "");
                      setForm((p) => ({ ...p, cedula: onlyDigits }));
                    }}
                    inputMode="numeric"
                  />
                  {errors.cedula && <div className="field-error">{errors.cedula}</div>}
                </div>

                <div className="formField">
                  <label className="fLabel">Correo</label>
                  <input
                    className={`input ${errors.correo_estudiante ? "input-error" : ""}`}
                    value={form.correo_estudiante}
                    onChange={(e) => setForm((p) => ({ ...p, correo_estudiante: e.target.value }))}
                  />
                  {errors.correo_estudiante && <div className="field-error">{errors.correo_estudiante}</div>}
                </div>

                <div className="formField">
                  <label className="fLabel">Nombres *</label>
                  <input
                    className={`input ${errors.nombres_estudiante ? "input-error" : ""}`}
                    value={form.nombres_estudiante}
                    onChange={(e) => setForm((p) => ({ ...p, nombres_estudiante: e.target.value }))}
                  />
                  {errors.nombres_estudiante && <div className="field-error">{errors.nombres_estudiante}</div>}
                </div>

                <div className="formField">
                  <label className="fLabel">Apellidos *</label>
                  <input
                    className={`input ${errors.apellidos_estudiante ? "input-error" : ""}`}
                    value={form.apellidos_estudiante}
                    onChange={(e) => setForm((p) => ({ ...p, apellidos_estudiante: e.target.value }))}
                  />
                  {errors.apellidos_estudiante && <div className="field-error">{errors.apellidos_estudiante}</div>}
                </div>

                <div className="formField full">
                  <label className="fLabel">Teléfono</label>
                  <input
                    className="input"
                    value={form.telefono_estudiante}
                    onChange={(e) => setForm((p) => ({ ...p, telefono_estudiante: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modalFooter">
                <button className="btnGhost" onClick={closeForm} disabled={loading}>
                  Cancelar
                </button>
                <button className="btnPrimary" onClick={onSave} disabled={loading}>
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===========================
          MODAL: VIEW
          =========================== */}
      {showViewModal && viewEstudiante && (
        <div className="modalOverlay" onMouseDown={closeView}>
          <div className="modalCard modalWide" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalHeaderLeft">
                <div className="modalHeaderIcon">
                  <Eye size={18} />
                </div>
                <div>
                  <div className="modalHeaderTitle">Detalle de Estudiante</div>
                  <div className="modalHeaderSub">Información registrada</div>
                </div>
              </div>

              <button className="modalClose" onClick={closeView} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="modalDivider" />

            <div className="modalBody">
              <div className="viewGrid">
                <div className="vCard">
                  <div className="vLabel">
                    <BadgeCheck className="vIcon" /> ID institucional
                  </div>
                  <div className="vValue mono">{viewEstudiante.id_institucional_estudiante}</div>
                </div>

                {/* ✅ NUEVO */}
                <div className="vCard">
                  <div className="vLabel">
                    <CreditCard className="vIcon" /> Cédula
                  </div>
                  <div className="vValue mono">{(viewEstudiante as any).cedula || "-"}</div>
                </div>

                <div className="vCard">
                  <div className="vLabel">
                    <User className="vIcon" /> Estudiante
                  </div>
                  <div className="vValue">
                    {viewEstudiante.apellidos_estudiante} {viewEstudiante.nombres_estudiante}
                  </div>
                </div>

                <div className="vCard">
                  <div className="vLabel">
                    <Mail className="vIcon" /> Correo
                  </div>
                  <div className="vValue">{viewEstudiante.correo_estudiante || "-"}</div>
                </div>

                <div className="vCard">
                  <div className="vLabel">
                    <Hash className="vIcon" /> Carrera–Período
                  </div>
                  <div className="vValue">{selectedCPLabel || viewEstudiante.id_carrera_periodo}</div>
                </div>

                <div className="vCard vCardFull">
                  <div className="vLabel">
                    <BadgeCheck className="vIcon" /> Estado
                  </div>
                  <div className="vValue">
                    {isActivo(viewEstudiante.estado) ? (
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
                  </div>
                </div>
              </div>

              <div className="modalFooter">
                <button className="btnGhost" onClick={closeView}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===========================
          MODAL: IMPORT
          =========================== */}
      {showImportModal && (
        <div className="modalOverlay" onMouseDown={closeImport}>
          <div className="modalCard modalWide" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalHeaderLeft">
                <div className="modalHeaderIcon">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <div className="modalHeaderTitle">Importar Estudiantes</div>
                  <div className="modalHeaderSub">Sube el Excel y se importará por (nombre_carrera + codigo_periodo)</div>
                </div>
              </div>

              <button className="modalClose" onClick={closeImport} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="modalDivider" />

            <div className="modalBody">
              <div className="infoBox">
                <Info />
                <div className="infoText">
                  La plantilla incluye: <b>nombre_carrera</b>, <b>codigo_periodo</b>, <b>id_institucional</b>,{" "}
                  <b>cedula</b>, nombres, apellidos, correo y teléfono.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <button className="btnGhost" onClick={downloadPlantillaEstudiantesCSV} disabled={importing}>
                  <Download size={16} style={{ marginRight: 8 }} />
                  Plantilla
                </button>

                <button className="btnPrimary" onClick={onPickFile} disabled={importing}>
                  <Upload size={16} style={{ marginRight: 8 }} />
                  {importing ? "Importando..." : "Seleccionar archivo"}
                </button>
              </div>

              <div style={{ marginTop: 10, opacity: 0.75 }}>
                Formatos permitidos: <b>.xlsx</b>, <b>.xls</b>, <b>.csv</b>
              </div>

              <div className="modalFooter">
                <button className="btnGhost" onClick={closeImport} disabled={importing}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
