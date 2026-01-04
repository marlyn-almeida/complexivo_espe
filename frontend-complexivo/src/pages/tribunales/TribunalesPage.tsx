import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Eye, ToggleLeft, ToggleRight, Search, CalendarPlus } from "lucide-react";
import "./TribunalesPage.css";

import type { Tribunal, Estado01 as Estado01Trib } from "../../types/tribunal";
import type { TribunalEstudiante, Estado01 as Estado01TE } from "../../types/tribunalEstudiante";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { Estudiante } from "../../types/estudiante";
import type { FranjaHorario } from "../../types/franjaHoraria";
import type { CarreraDocente } from "../../types/carreraDocente";

import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { estudiantesService } from "../../services/estudiantes.service";
import { franjaHorarioService } from "../../services/franjasHorarias.service"; // ✅ lo dejas como tú lo tienes
import { tribunalesService } from "../../services/tribunales.service";
import { tribunalEstudiantesService } from "../../services/tribunalEstudiantes.service";
import { carreraDocenteService } from "../../services/carreraDocente.service"; // ✅ NUEVO

import TribunalAsignacionesModal from "./TribunalAsignacionesModal";

const PAGE_SIZE = 10;

type ToastType = "success" | "error" | "info";

type TribunalFormState = {
  id_carrera_periodo: number | "";
  nombre_tribunal: string;
  caso: string; // input string (opcional)
  descripcion_tribunal: string;

  // ✅ ahora son id_carrera_docente
  presidente: number | "";
  integrante1: number | "";
  integrante2: number | "";
};

type AsignacionFormState = {
  id_estudiante: number | "";
  id_franja_horario: number | "";
};

export default function TribunalesPage() {
  // ===== DATA =====
  const [carreraPeriodos, setCarreraPeriodos] = useState<CarreraPeriodo[]>([]);
  const [selectedCP, setSelectedCP] = useState<number | "">("");

  const [tribunales, setTribunales] = useState<Tribunal[]>([]);
  const [docentes, setDocentes] = useState<CarreraDocente[]>([]); // ✅ CAMBIO
  const [loading, setLoading] = useState(false);

  // ===== UI / FILTROS =====
  const [search, setSearch] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [page, setPage] = useState(1);

  // ===== MODALES =====
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingTribunal, setEditingTribunal] = useState<Tribunal | null>(null);
  const [viewTribunal, setViewTribunal] = useState<Tribunal | null>(null);

  // ===== MODAL ASIGNACIÓN =====
  const [showAsignModal, setShowAsignModal] = useState(false);
  const [activeTribunalForAsign, setActiveTribunalForAsign] = useState<Tribunal | null>(null);
  const [asignaciones, setAsignaciones] = useState<TribunalEstudiante[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [franjas, setFranjas] = useState<FranjaHorario[]>([]);

  // ===== FORM tribunal =====
  const [form, setForm] = useState<TribunalFormState>({
    id_carrera_periodo: "",
    nombre_tribunal: "",
    caso: "",
    descripcion_tribunal: "",
    presidente: "",
    integrante1: "",
    integrante2: "",
  });

  // ===== FORM asignación =====
  const [asignForm, setAsignForm] = useState<AsignacionFormState>({
    id_estudiante: "",
    id_franja_horario: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  // ===== HELPERS =====
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function estado01(v: any): 0 | 1 {
    return Number(v) === 1 ? 1 : 0;
  }
  function isActivo(v: any): boolean {
    return estado01(v) === 1;
  }

  function selectedCPLabel(): string {
    const cp = carreraPeriodos.find((x) => x.id_carrera_periodo === selectedCP);
    if (!cp) return "";
    const carrera = cp.nombre_carrera ?? "Carrera";
    const periodo = cp.codigo_periodo ?? cp.descripcion_periodo ?? "Período";
    return `${carrera} — ${periodo}`;
  }

  function resetForm() {
    setEditingTribunal(null);
    setForm({
      id_carrera_periodo: selectedCP || "",
      nombre_tribunal: "",
      caso: "",
      descripcion_tribunal: "",
      presidente: "",
      integrante1: "",
      integrante2: "",
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

  function openEdit(t: Tribunal) {
    setEditingTribunal(t);
    setForm({
      id_carrera_periodo: t.id_carrera_periodo,
      nombre_tribunal: t.nombre_tribunal ?? "",
      caso: t.caso == null ? "" : String(t.caso),
      descripcion_tribunal: t.descripcion_tribunal ?? "",
      // si quieres, luego hacemos GET detalle con miembros para precargar
      presidente: "",
      integrante1: "",
      integrante2: "",
    });
    setErrors({});
    setShowFormModal(true);
  }

  function openView(t: Tribunal) {
    setViewTribunal(t);
    setShowViewModal(true);
  }

  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;

    if (Array.isArray(list) && list.length) {
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;

    return "Error al guardar";
  }

  // ===== LOADS =====
  useEffect(() => {
    loadCarreraPeriodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCP) {
      loadAll();
      loadDocentesByCP(); // ✅ importante: docentes por ese CP
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCP, mostrarInactivos]);

  async function loadCarreraPeriodos() {
    try {
      setLoading(true);
      const cps = await carreraPeriodoService.list(false);
      setCarreraPeriodos(cps);

      const first = cps.find((x) => Boolean(x.estado)) ?? cps[0];
      if (first) setSelectedCP(first.id_carrera_periodo);
    } catch {
      showToast("Error al cargar Carrera–Período", "error");
      setCarreraPeriodos([]);
      setSelectedCP("");
    } finally {
      setLoading(false);
    }
  }

  async function loadDocentesByCP() {
    if (!selectedCP) return;
    try {
      const data = await carreraDocenteService.list({
        includeInactive: false,
        carreraPeriodoId: Number(selectedCP),
      });
      setDocentes(data ?? []);
    } catch {
      setDocentes([]);
    }
  }

  async function loadAll() {
    if (!selectedCP) return;

    try {
      setLoading(true);
      const data = await tribunalesService.list({
        includeInactive: mostrarInactivos,
        carreraPeriodoId: Number(selectedCP),
        q: search.trim() || undefined,
        page: 1,
        limit: 100,
      });
      setTribunales(data);
      setPage(1);
    } catch {
      showToast("Error al cargar tribunales", "error");
      setTribunales([]);
    } finally {
      setLoading(false);
    }
  }

  // ===== FILTRO + PAGINACIÓN =====
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return tribunales
      .filter((t) => (mostrarInactivos ? true : isActivo(t.estado)))
      .filter((t) => {
        if (!q) return true;
        return (t.nombre_tribunal || "").toLowerCase().includes(q) || String(t.caso ?? "").toLowerCase().includes(q);
      });
  }, [tribunales, search, mostrarInactivos]);

  const total = filtered.length;
  const activos = filtered.filter((x) => isActivo(x.estado)).length;
  const inactivos = total - activos;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ===== VALIDACIÓN tribunal =====
  function validateForm(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!form.id_carrera_periodo) e.id_carrera_periodo = "Seleccione Carrera–Período.";
    if (!form.nombre_tribunal.trim()) e.nombre_tribunal = "Nombre del tribunal obligatorio.";

    if (form.caso.trim() && (!/^\d+$/.test(form.caso.trim()) || Number(form.caso) <= 0)) {
      e.caso = "Caso debe ser un número entero positivo (opcional).";
    }

    if (!form.presidente) e.presidente = "Seleccione Presidente.";
    if (!form.integrante1) e.integrante1 = "Seleccione Integrante 1.";
    if (!form.integrante2) e.integrante2 = "Seleccione Integrante 2.";

    const ids = [form.presidente, form.integrante1, form.integrante2].filter(Boolean) as number[];
    if (ids.length === 3 && new Set(ids).size !== 3) e.docentes = "No puedes repetir el mismo docente en el tribunal.";

    return e;
  }

  function buildDocentesPayloadObject() {
    // ✅ ya son ids de carrera_docente
    return {
      presidente: Number(form.presidente),
      integrante1: Number(form.integrante1),
      integrante2: Number(form.integrante2),
    };
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
        nombre_tribunal: form.nombre_tribunal.trim(),
        caso: form.caso.trim() ? Number(form.caso.trim()) : undefined,
        descripcion_tribunal: form.descripcion_tribunal.trim() ? form.descripcion_tribunal.trim() : undefined,
        docentes: buildDocentesPayloadObject(),
      };

      if (editingTribunal) {
        await tribunalesService.update(editingTribunal.id_tribunal, payload as any);
        showToast("Tribunal actualizado.", "success");
      } else {
        await tribunalesService.create(payload as any);
        showToast("Tribunal creado.", "success");
      }

      setShowFormModal(false);
      await loadAll();
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  async function onToggleEstado(t: Tribunal) {
    try {
      setLoading(true);
      const current: Estado01Trib = estado01(t.estado) as Estado01Trib;
      await tribunalesService.toggleEstado(t.id_tribunal, current);
      showToast(current === 1 ? "Tribunal desactivado." : "Tribunal activado.", "success");
      await loadAll();
    } catch {
      showToast("No se pudo cambiar el estado.", "error");
    } finally {
      setLoading(false);
    }
  }

  // ===== ASIGNACIÓN Tribunal–Estudiante =====
  async function openAsignaciones(t: Tribunal) {
    setActiveTribunalForAsign(t);
    setAsignForm({ id_estudiante: "", id_franja_horario: "" });
    setErrors({});

    try {
      setLoading(true);

      const [a, est, fr] = await Promise.all([
        tribunalEstudiantesService.list({
          tribunalId: t.id_tribunal,
          includeInactive: true,
          page: 1,
          limit: 100,
        }),
        estudiantesService.list({
          carreraPeriodoId: t.id_carrera_periodo,
          includeInactive: false,
          page: 1,
          limit: 100,
        }),
        franjaHorarioService.list({
          carreraPeriodoId: t.id_carrera_periodo,
          includeInactive: false,
          page: 1,
          limit: 100,
        }),
      ]);

      setAsignaciones(a);
      setEstudiantes(est);
      setFranjas(fr);

      setShowAsignModal(true);
    } catch {
      showToast("No se pudo cargar datos para asignación.", "error");
    } finally {
      setLoading(false);
    }
  }

  function validateAsignForm(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!activeTribunalForAsign) e.tribunal = "No hay tribunal seleccionado.";
    if (!asignForm.id_estudiante) e.id_estudiante = "Seleccione un estudiante.";
    if (!asignForm.id_franja_horario) e.id_franja_horario = "Seleccione una franja horaria.";
    return e;
  }

  async function onCreateAsignacion() {
    const e = validateAsignForm();
    setErrors(e);
    if (Object.keys(e).length) {
      showToast("Complete los campos de asignación.", "error");
      return;
    }
    if (!activeTribunalForAsign) return;

    try {
      setLoading(true);

      await tribunalEstudiantesService.create({
        id_tribunal: activeTribunalForAsign.id_tribunal,
        id_estudiante: Number(asignForm.id_estudiante),
        id_franja_horario: Number(asignForm.id_franja_horario),
      });

      showToast("Asignación creada.", "success");

      const a = await tribunalEstudiantesService.list({
        tribunalId: activeTribunalForAsign.id_tribunal,
        includeInactive: true,
        page: 1,
        limit: 100,
      });
      setAsignaciones(a);

      setAsignForm({ id_estudiante: "", id_franja_horario: "" });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "No se pudo crear la asignación.";
      showToast(String(msg), "error");
    } finally {
      setLoading(false);
    }
  }

  async function onToggleAsignEstado(row: TribunalEstudiante) {
    try {
      setLoading(true);
      const current: Estado01TE = estado01(row.estado) as Estado01TE;
      await tribunalEstudiantesService.toggleEstado(row.id_tribunal_estudiante, current);

      showToast(current === 1 ? "Asignación desactivada." : "Asignación activada.", "success");

      if (activeTribunalForAsign) {
        const a = await tribunalEstudiantesService.list({
          tribunalId: activeTribunalForAsign.id_tribunal,
          includeInactive: true,
          page: 1,
          limit: 100,
        });
        setAsignaciones(a);
      }
    } catch {
      showToast("No se pudo cambiar el estado de la asignación.", "error");
    } finally {
      setLoading(false);
    }
  }

  const cpLabel = selectedCPLabel();

  return (
    <div className="page">
      {toast ? <div className={`toast toast-${toast.type}`}>{toast.msg}</div> : null}

      <div className="card">
        <div className="headerRow">
          <div>
            <h2 className="title">Tribunales</h2>
            <p className="subtitle">Crea tribunales por Carrera–Período y asigna docentes (Presidente e Integrantes).</p>
            {cpLabel ? (
              <p className="tribunales-sub">
                Trabajando en: <b>{cpLabel}</b>
              </p>
            ) : null}
          </div>

          <button className="btnPrimary" onClick={openCreate}>
            <Plus size={18} /> Nuevo tribunal
          </button>
        </div>

        <div className="summaryRow">
          <div className="summaryBoxes">
            <div className="summaryBox">
              <span className="label">Total</span>
              <span className="value">{total}</span>
            </div>
            <div className="summaryBox active">
              <span className="label">Activos</span>
              <span className="value">{activos}</span>
            </div>
            <div className="summaryBox inactive">
              <span className="label">Inactivos</span>
              <span className="value">{inactivos}</span>
            </div>
          </div>

          <div className="summaryActions">
            <div className="field">
              <label className="fieldLabel">Carrera–Período</label>
              <select className="select" value={selectedCP} onChange={(e) => setSelectedCP(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Seleccione...</option>
                {carreraPeriodos.map((cp) => (
                  <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                    {(cp.nombre_carrera ?? "Carrera") + " — " + (cp.codigo_periodo ?? cp.descripcion_periodo ?? "Período")}
                  </option>
                ))}
              </select>
            </div>

            <div className="searchBox">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadAll()}
                placeholder="Buscar por nombre o caso..."
              />
            </div>

            <button className="btnSecondary" onClick={loadAll} disabled={loading}>
              Buscar
            </button>

            <label className="toggle">
              <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} />
              <span className="slider" />
              <span className="toggleText">Mostrar inactivos</span>
            </label>
          </div>
        </div>
      </div>

      <div className="card tableCard">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tribunal</th>
                <th>Caso</th>
                <th>Estado</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty">
                    No hay tribunales para mostrar.
                  </td>
                </tr>
              ) : (
                paginated.map((t) => {
                  const activo = isActivo(t.estado);
                  return (
                    <tr key={t.id_tribunal}>
                      <td>
                        <div className="tdTitle">{t.nombre_tribunal}</div>
                        <div className="tdSub">{t.nombre_carrera ? `${t.nombre_carrera} — ${t.codigo_periodo ?? ""}` : "—"}</div>
                      </td>
                      <td>{t.caso == null ? <span className="muted">—</span> : t.caso}</td>
                      <td>
                        <span className={`badge ${activo ? "badgeActive" : "badgeInactive"}`}>{activo ? "Activo" : "Inactivo"}</span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btnIcon" onClick={() => openView(t)} title="Ver">
                            <Eye size={18} />
                          </button>
                          <button className="btnIcon" onClick={() => openEdit(t)} title="Editar">
                            <Pencil size={18} />
                          </button>
                          <button className="btnIcon" onClick={() => onToggleEstado(t)} title="Activar/Desactivar">
                            {activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                          <button className="btnIcon primary" onClick={() => openAsignaciones(t)} title="Asignar estudiantes a franjas">
                            <CalendarPlus size={18} />
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
      </div>

      <div className="card paginationCard">
        <div className="paginationCenter">
          <button className="btnSecondary" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Anterior
          </button>
          <span className="muted">
            Página <b>{currentPage}</b> de <b>{totalPages}</b>
          </span>
          <button className="btnSecondary" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Siguiente
          </button>
        </div>
      </div>

      {/* MODAL FORM */}
      {showFormModal ? (
        <div className="modalOverlay" onMouseDown={() => setShowFormModal(false)}>
          <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3 className="modalTitle">{editingTribunal ? "Editar tribunal" : "Nuevo tribunal"}</h3>
              <button className="btnClose" onClick={() => setShowFormModal(false)}>
                ✕
              </button>
            </div>

            <div className="modalBody">
              <div className="grid2">
                <div className="field">
                  <label className="fieldLabel">Carrera–Período</label>
                  <select
                    className="select"
                    value={form.id_carrera_periodo}
                    onChange={(e) => setForm((p) => ({ ...p, id_carrera_periodo: e.target.value ? Number(e.target.value) : "" }))}
                  >
                    <option value="">Seleccione...</option>
                    {carreraPeriodos.map((cp) => (
                      <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                        {(cp.nombre_carrera ?? "Carrera") + " — " + (cp.codigo_periodo ?? cp.descripcion_periodo ?? "Período")}
                      </option>
                    ))}
                  </select>
                  {errors.id_carrera_periodo ? <p className="error">{errors.id_carrera_periodo}</p> : null}
                </div>

                <div className="field">
                  <label className="fieldLabel">Caso (opcional)</label>
                  <input className="input" value={form.caso} onChange={(e) => setForm((p) => ({ ...p, caso: e.target.value }))} placeholder="Ej: 6" />
                  {errors.caso ? <p className="error">{errors.caso}</p> : null}
                </div>

                <div className="field full">
                  <label className="fieldLabel">Nombre del tribunal</label>
                  <input
                    className="input"
                    value={form.nombre_tribunal}
                    onChange={(e) => setForm((p) => ({ ...p, nombre_tribunal: e.target.value }))}
                    placeholder="Ej: Tribunal 1"
                  />
                  {errors.nombre_tribunal ? <p className="error">{errors.nombre_tribunal}</p> : null}
                </div>

                <div className="field full">
                  <label className="fieldLabel">Descripción (opcional)</label>
                  <textarea
                    className="textarea"
                    value={form.descripcion_tribunal}
                    onChange={(e) => setForm((p) => ({ ...p, descripcion_tribunal: e.target.value }))}
                    placeholder="Notas / detalles..."
                  />
                </div>

                {/* ✅ SELECTS CON id_carrera_docente */}
                <div className="field">
                  <label className="fieldLabel">Presidente</label>
                  <select
                    className="select"
                    value={form.presidente}
                    onChange={(e) => setForm((p) => ({ ...p, presidente: e.target.value ? Number(e.target.value) : "" }))}
                  >
                    <option value="">Seleccione...</option>
                    {docentes.map((cd) => (
                      <option key={cd.id_carrera_docente} value={cd.id_carrera_docente}>
                        {cd.apellidos_docente} {cd.nombres_docente} — {cd.id_institucional_docente}
                      </option>
                    ))}
                  </select>
                  {errors.presidente ? <p className="error">{errors.presidente}</p> : null}
                </div>

                <div className="field">
                  <label className="fieldLabel">Integrante 1</label>
                  <select
                    className="select"
                    value={form.integrante1}
                    onChange={(e) => setForm((p) => ({ ...p, integrante1: e.target.value ? Number(e.target.value) : "" }))}
                  >
                    <option value="">Seleccione...</option>
                    {docentes.map((cd) => (
                      <option key={cd.id_carrera_docente} value={cd.id_carrera_docente}>
                        {cd.apellidos_docente} {cd.nombres_docente} — {cd.id_institucional_docente}
                      </option>
                    ))}
                  </select>
                  {errors.integrante1 ? <p className="error">{errors.integrante1}</p> : null}
                </div>

                <div className="field">
                  <label className="fieldLabel">Integrante 2</label>
                  <select
                    className="select"
                    value={form.integrante2}
                    onChange={(e) => setForm((p) => ({ ...p, integrante2: e.target.value ? Number(e.target.value) : "" }))}
                  >
                    <option value="">Seleccione...</option>
                    {docentes.map((cd) => (
                      <option key={cd.id_carrera_docente} value={cd.id_carrera_docente}>
                        {cd.apellidos_docente} {cd.nombres_docente} — {cd.id_institucional_docente}
                      </option>
                    ))}
                  </select>
                  {errors.integrante2 ? <p className="error">{errors.integrante2}</p> : null}
                </div>

                {errors.docentes ? (
                  <div className="field full">
                    <p className="error">{errors.docentes}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="modalFooter">
              <button className="btnSecondary" onClick={() => setShowFormModal(false)} disabled={loading}>
                Cancelar
              </button>
              <button className="btnPrimary" onClick={onSave} disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL VIEW */}
      {showViewModal && viewTribunal ? (
        <div className="modalOverlay" onMouseDown={() => setShowViewModal(false)}>
          <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3 className="modalTitle">Detalle del tribunal</h3>
              <button className="btnClose" onClick={() => setShowViewModal(false)}>
                ✕
              </button>
            </div>
            <div className="modalBody">
              <div className="kv">
                <div className="kvRow">
                  <span className="kvKey">Nombre</span>
                  <span className="kvVal">{viewTribunal.nombre_tribunal}</span>
                </div>
                <div className="kvRow">
                  <span className="kvKey">Caso</span>
                  <span className="kvVal">{viewTribunal.caso == null ? "—" : viewTribunal.caso}</span>
                </div>
                <div className="kvRow">
                  <span className="kvKey">Descripción</span>
                  <span className="kvVal">{viewTribunal.descripcion_tribunal?.trim() ? viewTribunal.descripcion_tribunal : "—"}</span>
                </div>
                <div className="kvRow">
                  <span className="kvKey">Carrera–Período</span>
                  <span className="kvVal">{selectedCPLabel() || "—"}</span>
                </div>
                <div className="kvRow">
                  <span className="kvKey">Estado</span>
                  <span className="kvVal">{isActivo(viewTribunal.estado) ? "Activo" : "Inactivo"}</span>
                </div>
              </div>
            </div>
            <div className="modalFooter">
              <button className="btnPrimary" onClick={() => setShowViewModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL ASIGNACIONES */}
      <TribunalAsignacionesModal
        showAsignModal={showAsignModal}
        setShowAsignModal={setShowAsignModal}
        activeTribunalForAsign={activeTribunalForAsign}
        asignForm={asignForm}
        setAsignForm={setAsignForm}
        estudiantes={estudiantes}
        franjas={franjas}
        asignaciones={asignaciones}
        errors={errors}
        loading={loading}
        onCreateAsignacion={onCreateAsignacion}
        onToggleAsignEstado={onToggleAsignEstado}
        isActivo={isActivo}
      />
    </div>
  );
}
