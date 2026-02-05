// src/pages/tribunales/TribunalesPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  CalendarPlus,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./TribunalesPage.css";

import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { Estudiante } from "../../types/estudiante";
import type { FranjaHorario } from "../../types/franjaHoraria";
import type { CarreraDocente } from "../../types/carreraDocente";

import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { estudiantesService } from "../../services/estudiantes.service";
import { franjaHorarioService } from "../../services/franjasHorarias.service";
import { tribunalesService } from "../../services/tribunales.service";
import { tribunalEstudiantesService } from "../../services/tribunalEstudiantes.service";
import { carreraDocenteService } from "../../services/carreraDocente.service";

import { planEvaluacionService } from "../../services/planEvaluacion.service";
import { calificadoresGeneralesService } from "../../services/calificadoresGenerales.service";

import TribunalAsignacionesModal from "./TribunalAsignacionesModal";
import TribunalViewModal from "./TribunalViewModal";

// ✅ CLAVE: guardar CP activo para que axiosClient mande header x-carrera-periodo-id
import { setActiveCarreraPeriodoId } from "../../api/axiosClient";

const PAGE_SIZE = 10;

type ToastType = "success" | "error" | "info";

type AsignacionFormState = {
  id_estudiante: number | "";
  id_franja_horario: number | "";
};

export default function TribunalesPage() {
  const navigate = useNavigate();

  // ===== DATA =====
  const [carreraPeriodos, setCarreraPeriodos] = useState<CarreraPeriodo[]>([]);
  const [selectedCP, setSelectedCP] = useState<number | "">("");

  const [tribunales, setTribunales] = useState<Tribunal[]>([]);
  const [docentes, setDocentes] = useState<CarreraDocente[]>([]);

  const [loading, setLoading] = useState(false);

  // ===== BLOQUES SUPERIORES =====
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);

  const [cg1, setCg1] = useState<number | "">("");
  const [cg2, setCg2] = useState<number | "">("");
  const [cg3, setCg3] = useState<number | "">("");
  const [savingCG, setSavingCG] = useState(false);

  // ===== UI / FILTROS =====
  const [search, setSearch] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [page, setPage] = useState(1);

  // ===== MODALES =====
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTribunal, setViewTribunal] = useState<Tribunal | null>(null);

  // ===== MODAL ASIGNACIÓN =====
  const [showAsignModal, setShowAsignModal] = useState(false);
  const [activeTribunalForAsign, setActiveTribunalForAsign] = useState<Tribunal | null>(null);
  const [asignaciones, setAsignaciones] = useState<TribunalEstudiante[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [franjas, setFranjas] = useState<FranjaHorario[]>([]);

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
    const cp = carreraPeriodos.find((x) => Number(x.id_carrera_periodo) === Number(selectedCP));
    if (!cp) return "";
    const carrera = (cp as any).nombre_carrera ?? "Carrera";
    const periodo = (cp as any).codigo_periodo ?? (cp as any).descripcion_periodo ?? "Período";
    return `${carrera} — ${periodo}`;
  }

  function openView(t: Tribunal) {
    setViewTribunal(t);
    setShowViewModal(true);
  }

  // ===== LOADS =====
  useEffect(() => {
    loadCarreraPeriodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCP) {
      loadAll();
      loadDocentesByCP();
      loadPlanAndCalificadores();
    } else {
      setTribunales([]);
      setDocentes([]);
      setPlan(null);
      setCg1("");
      setCg2("");
      setCg3("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCP, mostrarInactivos]);

  // ✅ Importante: usa CP guardado si existe
  async function loadCarreraPeriodos() {
    try {
      setLoading(true);
      const cps = await carreraPeriodoService.list(false);
      setCarreraPeriodos(cps);

      // 1) intentar CP guardado
      const savedRaw = localStorage.getItem("active_carrera_periodo_id");
      const saved = savedRaw ? Number(savedRaw) : 0;

      const savedExists =
        saved > 0 &&
        cps.some(
          (x: any) => Number(x.id_carrera_periodo) === saved && Boolean((x as any).estado)
        );

      if (savedExists) {
        setSelectedCP(saved);
        setActiveCarreraPeriodoId(saved); // ✅ header para todo el sistema
        return;
      }

      // 2) fallback: primer CP activo
      const first = (cps ?? []).find((x: any) => Boolean((x as any).estado)) ?? (cps ?? [])[0];

      if (first) {
        setSelectedCP((first as any).id_carrera_periodo);
        setActiveCarreraPeriodoId((first as any).id_carrera_periodo);
      } else {
        setSelectedCP("");
        setActiveCarreraPeriodoId(null);
      }
    } catch {
      showToast("Error al cargar Carrera–Período", "error");
      setCarreraPeriodos([]);
      setSelectedCP("");
      setActiveCarreraPeriodoId(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocentesByCP() {
    if (!selectedCP) return;

    try {
      const cp = carreraPeriodos.find((x) => Number((x as any).id_carrera_periodo) === Number(selectedCP));
      const carreraId = (cp as any)?.id_carrera;

      if (!carreraId) {
        setDocentes([]);
        return;
      }

      const data = await carreraDocenteService.list({
        includeInactive: false,
        carreraId: Number(carreraId),
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
      setTribunales(data ?? []);
      setPage(1);
    } catch {
      showToast("Error al cargar tribunales", "error");
      setTribunales([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlanAndCalificadores() {
    if (!selectedCP) return;

    // PLAN
    try {
      setLoadingPlan(true);
      const p = await planEvaluacionService.getByCP(Number(selectedCP));
      setPlan(p);
    } catch {
      setPlan(null);
    } finally {
      setLoadingPlan(false);
    }

    // CALIFICADORES
    try {
      const rows = await calificadoresGeneralesService.list(Number(selectedCP), false);
      const ids = (rows ?? [])
        .map((r: any) => Number(r.id_carrera_docente))
        .filter((n: any) => Number.isFinite(n));
      setCg1(ids[0] ?? "");
      setCg2(ids[1] ?? "");
      setCg3(ids[2] ?? "");
    } catch {
      setCg1("");
      setCg2("");
      setCg3("");
    }
  }

  // ===== FILTRO + PAGINACIÓN =====
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (tribunales ?? [])
      .filter((t) => (mostrarInactivos ? true : isActivo((t as any).estado)))
      .filter((t) => {
        if (!q) return true;
        return (
          String((t as any).nombre_tribunal || "").toLowerCase().includes(q) ||
          String((t as any).caso ?? "").toLowerCase().includes(q)
        );
      });
  }, [tribunales, search, mostrarInactivos]);

  const total = filtered.length;
  const activos = filtered.filter((x) => isActivo((x as any).estado)).length;
  const inactivos = total - activos;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ===== ASIGNACIÓN Tribunal–Estudiante =====
  async function openAsignaciones(t: Tribunal) {
    setActiveTribunalForAsign(t);
    setAsignForm({ id_estudiante: "", id_franja_horario: "" });
    setErrors({});

    try {
      setLoading(true);

      const [a, est, fr] = await Promise.all([
        tribunalEstudiantesService.list({
          tribunalId: (t as any).id_tribunal,
          includeInactive: true,
          page: 1,
          limit: 100,
        }),
        estudiantesService.list({
          carreraPeriodoId: Number((t as any).id_carrera_periodo),
          includeInactive: false,
          page: 1,
          limit: 100,
        }),
        franjaHorarioService.list({
          carreraPeriodoId: Number((t as any).id_carrera_periodo),
          includeInactive: false,
          page: 1,
          limit: 100,
        }),
      ]);

      setAsignaciones(a ?? []);
      setEstudiantes(est ?? []);
      setFranjas(fr ?? []);
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
        id_tribunal: Number((activeTribunalForAsign as any).id_tribunal),
        id_estudiante: Number(asignForm.id_estudiante),
        id_franja_horario: Number(asignForm.id_franja_horario),
      });

      showToast("Asignación creada.", "success");

      const a = await tribunalEstudiantesService.list({
        tribunalId: Number((activeTribunalForAsign as any).id_tribunal),
        includeInactive: true,
        page: 1,
        limit: 100,
      });
      setAsignaciones(a ?? []);
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
      const current = estado01((row as any).estado);

      await tribunalEstudiantesService.toggleEstado(
        Number((row as any).id_tribunal_estudiante),
        current as 0 | 1
      );

      showToast(current === 1 ? "Asignación desactivada." : "Asignación activada.", "success");

      if (activeTribunalForAsign) {
        const a = await tribunalEstudiantesService.list({
          tribunalId: Number((activeTribunalForAsign as any).id_tribunal),
          includeInactive: true,
          page: 1,
          limit: 100,
        });
        setAsignaciones(a ?? []);
      }
    } catch {
      showToast("No se pudo cambiar el estado de la asignación.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function onToggleEstado(t: Tribunal) {
    try {
      setLoading(true);
      const current = estado01((t as any).estado);

      await tribunalesService.toggleEstado(Number((t as any).id_tribunal), current as 0 | 1);

      showToast(current === 1 ? "Tribunal desactivado." : "Tribunal activado.", "success");
      await loadAll();
    } catch {
      showToast("No se pudo cambiar el estado.", "error");
    } finally {
      setLoading(false);
    }
  }

  // ===== GUARDAR CALIFICADORES GENERALES (3 slots usando POST/DELETE) =====
  function toNum(v: number | ""): number | null {
    return typeof v === "number" && v > 0 ? v : null;
  }

  function uniqueNonEmpty(ids: Array<number | null>) {
    const nums = ids.filter((x): x is number => typeof x === "number" && x > 0);
    return Array.from(new Set(nums));
  }

  async function onSaveCalificadoresGenerales() {
    if (!selectedCP) return;

    const desiredRaw = [toNum(cg1), toNum(cg2), toNum(cg3)];
    const desired = uniqueNonEmpty(desiredRaw);

    const totalSelected = desiredRaw.filter(Boolean).length;
    if (desired.length !== totalSelected) {
      showToast("No repitas el mismo docente en Calificador 1, 2 y 3.", "error");
      return;
    }

    try {
      setSavingCG(true);

      const currentRows = await calificadoresGeneralesService.list(Number(selectedCP), false);
      const currentActive = (currentRows ?? []).map((r: any) => ({
        id_cp_calificador_general: Number(r.id_cp_calificador_general),
        id_carrera_docente: Number(r.id_carrera_docente),
      }));

      const currentIds = new Set(currentActive.map((x: any) => x.id_carrera_docente));
      const desiredIds = new Set(desired);

      const toRemove = currentActive.filter((x: any) => !desiredIds.has(x.id_carrera_docente));
      const toAdd = desired.filter((id) => !currentIds.has(id));

      for (const r of toRemove) {
        await calificadoresGeneralesService.remove(Number(r.id_cp_calificador_general));
      }

      for (const id_carrera_docente of toAdd) {
        await calificadoresGeneralesService.create(Number(selectedCP), { id_carrera_docente });
      }

      showToast("Calificadores generales guardados.", "success");
      await loadPlanAndCalificadores();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "No se pudo guardar calificadores generales.";
      showToast(String(msg), "error");
    } finally {
      setSavingCG(false);
    }
  }

  const cpLabel = selectedCPLabel();

  return (
    <div className="tribunalesPage">
      {toast ? <div className={`toast toast-${toast.type}`}>{toast.msg}</div> : null}

      {/* HERO */}
      <div className="hero">
        <div className="heroLeft">
          <div className="heroText">
            <h2 className="heroTitle">GESTIÓN DE TRIBUNALES</h2>
            <p className="heroSubtitle">
              Tecnologías de la Información en línea — {cpLabel || "Seleccione Carrera–Período"}
            </p>
          </div>
        </div>

        <div className="heroActions">
          <button
            className="heroBtn primary"
            onClick={() => showToast("Formulario de creación pendiente de conectar (modal).", "info")}
          >
            <Plus className="heroBtnIcon" /> Añadir Tribunal
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="box">
        <div className="boxHead">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <Search size={18} />
            </span>
            Filtros
          </div>
        </div>

        <div className="filtersRow">
          <div className="filterWrap">
            <select
              className="select"
              value={selectedCP}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) : "";
                setSelectedCP(next);
                setActiveCarreraPeriodoId(typeof next === "number" ? next : null); // ✅ CLAVE
              }}
            >
              <option value="">Seleccione Carrera–Período...</option>
              {carreraPeriodos.map((cp: any) => (
                <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                  {(cp.nombre_carrera ?? "Carrera") +
                    " — " +
                    (cp.codigo_periodo ?? cp.descripcion_periodo ?? "Período")}
                </option>
              ))}
            </select>
          </div>

          <div className="searchWrap">
            <Search className="searchIcon" />
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadAll()}
              placeholder="Buscar por nombre o caso..."
            />
          </div>

          <button className="btnGhost" onClick={loadAll} disabled={loading}>
            Buscar
          </button>

          <label className="toggle">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            <span className="slider" />
            <span className="toggleText">Mostrar inactivos</span>
          </label>
        </div>

        {/* SUMMARY */}
        <div className="summaryRow" style={{ marginTop: 10 }}>
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
      </div>

      {/* ✅ TOP GRID (Plan + Calificadores) */}
      <div className="topGrid">
        {/* PLAN */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <AlertTriangle size={18} />
              </span>
              Plan de Evaluación
            </div>
          </div>

          {loadingPlan ? (
            <p className="muted">Cargando plan...</p>
          ) : !plan ? (
            <div className="planEmpty">
              <div className="planEmptyIcon">
                <AlertTriangle size={20} />
              </div>
              <div>No se ha configurado un Plan de Evaluación para esta carrera y período.</div>
              <button
                className="btnWarn"
                onClick={() => navigate(`/plan-evaluacion?cp=${selectedCP}`)}
                disabled={!selectedCP}
              >
                Configurar Plan Ahora
              </button>
            </div>
          ) : (
            <div className="planInfo">
              <p className="muted">
                Plan activo: <b>{plan.nombre_plan ?? "Plan de evaluación"}</b>
              </p>
              {plan.descripcion_plan ? <p className="muted">{plan.descripcion_plan}</p> : null}
              <button
                className="btnGhost"
                onClick={() => navigate(`/plan-evaluacion?cp=${selectedCP}`)}
                disabled={!selectedCP}
              >
                Ver / Editar Plan
              </button>
            </div>
          )}
        </div>

        {/* CALIFICADORES */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <Users size={18} />
              </span>
              Asignar Calificadores Generales
            </div>
          </div>

          <div className="cgGrid">
            <div className="cgRow">
              <div className="cgLabel">Calificador General 1</div>
              <select
                className="select"
                value={cg1}
                onChange={(e) => setCg1(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">-- Sin asignar --</option>
                {docentes.map((cd: any) => (
                  <option key={cd.id_carrera_docente} value={cd.id_carrera_docente}>
                    {(cd.apellidos_docente ?? "") + " " + (cd.nombres_docente ?? "")}
                  </option>
                ))}
              </select>
            </div>

            <div className="cgRow">
              <div className="cgLabel">Calificador General 2</div>
              <select
                className="select"
                value={cg2}
                onChange={(e) => setCg2(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">-- Sin asignar --</option>
                {docentes.map((cd: any) => (
                  <option key={cd.id_carrera_docente} value={cd.id_carrera_docente}>
                    {(cd.apellidos_docente ?? "") + " " + (cd.nombres_docente ?? "")}
                  </option>
                ))}
              </select>
            </div>

            <div className="cgRow">
              <div className="cgLabel">Calificador General 3</div>
              <select
                className="select"
                value={cg3}
                onChange={(e) => setCg3(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">-- Sin asignar --</option>
                {docentes.map((cd: any) => (
                  <option key={cd.id_carrera_docente} value={cd.id_carrera_docente}>
                    {(cd.apellidos_docente ?? "") + " " + (cd.nombres_docente ?? "")}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btnPrimary btnBlock"
              onClick={onSaveCalificadoresGenerales}
              disabled={!selectedCP || savingCG}
            >
              {savingCG ? "Guardando..." : "Guardar Calificadores Generales"}
            </button>
          </div>
        </div>
      </div>

      {/* TABLA TRIBUNALES */}
      <div className="box">
        <div className="boxHead">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <Users size={18} />
            </span>
            Listado de Tribunales
          </div>
        </div>

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
                  <td colSpan={4} className="emptyCell">
                    <div className="empty">No hay tribunales para mostrar.</div>
                  </td>
                </tr>
              ) : (
                paginated.map((t: any) => {
                  const activo = isActivo(t.estado);
                  return (
                    <tr key={t.id_tribunal}>
                      <td>
                        <div className="tdTitle">{t.nombre_tribunal}</div>
                        <div className="tdSub">
                          {t.nombre_carrera ? `${t.nombre_carrera} — ${t.codigo_periodo ?? ""}` : "—"}
                        </div>
                      </td>
                      <td>{t.caso == null ? <span className="muted">—</span> : t.caso}</td>
                      <td>
                        <span className={`badge ${activo ? "badgeActive" : "badgeInactive"}`}>
                          {activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="tdActions">
                        <div className="actions">
                          <button className="iconBtn iconBtn_neutral" onClick={() => openView(t)}>
                            <Eye className="iconAction" />
                            <span className="tooltip">Ver</span>
                          </button>

                          <button
                            className="iconBtn iconBtn_purple"
                            onClick={() => showToast("Edición pendiente de conectar (modal).", "info")}
                          >
                            <Pencil className="iconAction" />
                            <span className="tooltip">Editar</span>
                          </button>

                          <button className="iconBtn iconBtn_primary" onClick={() => onToggleEstado(t)}>
                            {activo ? <ToggleRight className="iconAction" /> : <ToggleLeft className="iconAction" />}
                            <span className="tooltip">{activo ? "Desactivar" : "Activar"}</span>
                          </button>

                          <button className="iconBtn iconBtn_neutral" onClick={() => openAsignaciones(t)}>
                            <CalendarPlus className="iconAction" />
                            <span className="tooltip">Asignar</span>
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

        <div className="paginationRow">
          <button
            className="btnGhost"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <span className="paginationText">
            Página <b>{currentPage}</b> de <b>{totalPages}</b>
          </span>
          <button
            className="btnGhost"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* ✅ MODAL VIEW */}
      <TribunalViewModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        tribunal={viewTribunal}
        cpLabel={selectedCPLabel() || ""}
        isActivo={isActivo}
        showToast={showToast}
        onOpenAsignaciones={(t) => {
          setShowViewModal(false);
          openAsignaciones(t);
        }}
      />

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
