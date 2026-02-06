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
  Save,
  X,
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
import { tribunalesService, type TribunalCreateDTO, type TribunalUpdateDTO } from "../../services/tribunales.service";
import { tribunalEstudiantesService } from "../../services/tribunalEstudiantes.service";
import { carreraDocenteService } from "../../services/carreraDocente.service";
import { docentesService } from "../../services/docentes.service";
import { carrerasService } from "../../services/carreras.service";

import { planEvaluacionService } from "../../services/planEvaluacion.service";
import { calificadoresGeneralesService } from "../../services/calificadoresGenerales.service";

import TribunalAsignacionesModal from "./TribunalAsignacionesModal";
import TribunalViewModal from "./TribunalViewModal";

import { setActiveCarreraPeriodoId } from "../../api/axiosClient";

const PAGE_SIZE = 10;

type ToastType = "success" | "error" | "info";

type AsignacionFormState = {
  id_estudiante: number | "";
  id_franja_horario: number | "";
};

type TribunalFormState = {
  nombre_tribunal: string;
  caso: string; // string para input
  descripcion_tribunal: string;

  presidente: number | "";
  integrante1: number | "";
  integrante2: number | "";
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

  // ===== MODAL CREAR/EDITAR TRIBUNAL =====
  const [showFormModal, setShowFormModal] = useState(false);
  const [editing, setEditing] = useState<Tribunal | null>(null);
  const [savingTribunal, setSavingTribunal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [tribunalForm, setTribunalForm] = useState<TribunalFormState>({
    nombre_tribunal: "",
    caso: "",
    descripcion_tribunal: "",
    presidente: "",
    integrante1: "",
    integrante2: "",
  });

  // ===== MODAL ASIGNACIÓN =====
  const [showAsignModal, setShowAsignModal] = useState(false);
  const [activeTribunalForAsign, setActiveTribunalForAsign] = useState<Tribunal | null>(null);
  const [asignaciones, setAsignaciones] = useState<TribunalEstudiante[]>([]);
  const [estudiantesAll, setEstudiantesAll] = useState<Estudiante[]>([]);
  const [eligibleEstudiantes, setEligibleEstudiantes] = useState<Estudiante[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

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
    const cp = carreraPeriodos.find((x: any) => Number(x.id_carrera_periodo) === Number(selectedCP));
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
      loadDocentesByCP(); // ✅ asegura carrera_docente para selects
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

  async function loadCarreraPeriodos() {
    try {
      setLoading(true);
      const cps = await carreraPeriodoService.list(false);
      setCarreraPeriodos(cps ?? []);

      const savedRaw = localStorage.getItem("active_carrera_periodo_id");
      const saved = savedRaw ? Number(savedRaw) : 0;

      const savedExists =
        saved > 0 &&
        (cps ?? []).some((x: any) => Number(x.id_carrera_periodo) === saved && Boolean((x as any).estado));

      if (savedExists) {
        setSelectedCP(saved);
        setActiveCarreraPeriodoId(saved);
        return;
      }

      const first = (cps ?? []).find((x: any) => Boolean((x as any).estado)) ?? (cps ?? [])[0];
      if (first) {
        const id = Number((first as any).id_carrera_periodo);
        setSelectedCP(id);
        setActiveCarreraPeriodoId(id);
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

  /**
   * ✅ Calificadores/Tribunales requieren carrera_docente.
   * Si no existe, intenta autogenerar desde:
   * carrera.id_departamento -> docentes por departamento -> POST /carreras-docentes
   */
  async function loadDocentesByCP() {
    if (!selectedCP) return;

    try {
      const cp: any =
        carreraPeriodos.find((x: any) => Number(x.id_carrera_periodo) === Number(selectedCP)) ?? null;

      const carreraId =
        Number(cp?.id_carrera) ||
        Number(cp?.carreraId) ||
        Number(cp?.carrera_id) ||
        Number(cp?.carrera?.id_carrera) ||
        0;

      if (!carreraId) {
        setDocentes([]);
        showToast("No se pudo obtener id_carrera del Carrera–Período.", "error");
        return;
      }

      // 1) intentar carrera_docente ya existente
      let cds = await carreraDocenteService.list({ includeInactive: false, carreraId });
      if ((cds ?? []).length > 0) {
        setDocentes(cds ?? []);
        return;
      }

      // 2) obtener dept desde carrera
      const carreras = await carrerasService.list(false);
      const carrera = (carreras ?? []).find((c: any) => Number(c.id_carrera) === Number(carreraId)) ?? null;

      const deptId =
        Number((carrera as any)?.id_departamento) ||
        Number((carrera as any)?.departamento_id) ||
        Number((carrera as any)?.departamento?.id_departamento) ||
        0;

      if (!deptId) {
        setDocentes([]);
        showToast("No hay docentes en carrera_docente y no pude obtener el departamento de la carrera.", "error");
        return;
      }

      const depDocentes = await docentesService.list({
        includeInactive: false,
        id_departamento: deptId,
        page: 1,
        limit: 200,
      });

      const activos = (depDocentes ?? []).filter((d: any) => Number(d.estado) === 1);
      if (!activos.length) {
        setDocentes([]);
        showToast("No hay docentes activos en el departamento de esta carrera.", "error");
        return;
      }

      // 👇 REQUIERE que exista carreraDocenteService.create en tu service TS
      for (const d of activos) {
        try {
          await carreraDocenteService.create({
            id_docente: Number((d as any).id_docente),
            id_carrera: Number(carreraId),
            tipo_admin: "DOCENTE",
          });
        } catch {
          // ignorar ya existe
        }
      }

      cds = await carreraDocenteService.list({ includeInactive: false, carreraId });
      setDocentes(cds ?? []);

      if ((cds ?? []).length) showToast("Docentes listos para Calificadores/Tribunales.", "success");
    } catch {
      setDocentes([]);
      showToast("No se pudieron cargar docentes para Calificadores/Tribunales.", "error");
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

    try {
      setLoadingPlan(true);
      const p = await planEvaluacionService.getByCP(Number(selectedCP));
      setPlan(p);
    } catch {
      setPlan(null);
    } finally {
      setLoadingPlan(false);
    }

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
      .filter((t: any) => (mostrarInactivos ? true : isActivo(t.estado)))
      .filter((t: any) => {
        if (!q) return true;
        return (
          String(t.nombre_tribunal || "").toLowerCase().includes(q) ||
          String(t.caso ?? "").toLowerCase().includes(q)
        );
      });
  }, [tribunales, search, mostrarInactivos]);

  const total = filtered.length;
  const activos = filtered.filter((x: any) => isActivo(x.estado)).length;
  const inactivos = total - activos;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ===== MODAL CREAR/EDITAR =====
  function resetTribunalForm() {
    setTribunalForm({
      nombre_tribunal: "",
      caso: "",
      descripcion_tribunal: "",
      presidente: "",
      integrante1: "",
      integrante2: "",
    });
    setFormErrors({});
  }

  function openCreateModal() {
    if (!selectedCP) return showToast("Seleccione Carrera–Período.", "error");
    resetTribunalForm();
    setEditing(null);
    setShowFormModal(true);
  }

  function openEditModal(t: Tribunal) {
    setEditing(t);
    setFormErrors({});
    setTribunalForm({
      nombre_tribunal: String((t as any).nombre_tribunal || ""),
      caso: (t as any).caso == null ? "" : String((t as any).caso),
      descripcion_tribunal: String((t as any).descripcion_tribunal || ""),
      // ⚠️ si tu backend NO devuelve ids docentes del tribunal, se quedan vacíos
      presidente: "",
      integrante1: "",
      integrante2: "",
    });
    setShowFormModal(true);
  }

  function validateTribunalForm(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!selectedCP) e.id_carrera_periodo = "Seleccione Carrera–Período.";
    if (!tribunalForm.nombre_tribunal.trim()) e.nombre_tribunal = "Ingrese el nombre del tribunal.";
    if (!tribunalForm.presidente) e.presidente = "Seleccione Presidente.";
    if (!tribunalForm.integrante1) e.integrante1 = "Seleccione Integrante 1.";
    if (!tribunalForm.integrante2) e.integrante2 = "Seleccione Integrante 2.";

    const ids = [tribunalForm.presidente, tribunalForm.integrante1, tribunalForm.integrante2].filter(Boolean);
    const uniq = new Set(ids as any[]);
    if (ids.length && uniq.size !== ids.length) e.docentes = "No repitas el mismo docente en el tribunal.";

    if (tribunalForm.caso.trim()) {
      const n = Number(tribunalForm.caso);
      if (!Number.isFinite(n) || n <= 0) e.caso = "Caso inválido (debe ser número positivo).";
    }
    return e;
  }

  async function onSaveTribunal() {
    const e = validateTribunalForm();
    setFormErrors(e);
    if (Object.keys(e).length) {
      showToast("Revisa el formulario del tribunal.", "error");
      return;
    }

    try {
      setSavingTribunal(true);

      const casoNum =
        tribunalForm.caso.trim() && Number.isFinite(Number(tribunalForm.caso)) ? Number(tribunalForm.caso) : undefined;

      if (!editing) {
        const payload: TribunalCreateDTO = {
          id_carrera_periodo: Number(selectedCP),
          nombre_tribunal: tribunalForm.nombre_tribunal.trim(),
          caso: casoNum,
          descripcion_tribunal: tribunalForm.descripcion_tribunal.trim() || undefined,
          docentes: {
            presidente: Number(tribunalForm.presidente),
            integrante1: Number(tribunalForm.integrante1),
            integrante2: Number(tribunalForm.integrante2),
          },
        };

        await tribunalesService.create(payload);
        showToast("Tribunal creado.", "success");
      } else {
        const payload: TribunalUpdateDTO = {
          id_carrera_periodo: Number(selectedCP),
          nombre_tribunal: tribunalForm.nombre_tribunal.trim(),
          caso: casoNum,
          descripcion_tribunal: tribunalForm.descripcion_tribunal.trim() || undefined,
          docentes: {
            presidente: Number(tribunalForm.presidente),
            integrante1: Number(tribunalForm.integrante1),
            integrante2: Number(tribunalForm.integrante2),
          },
        };

        await tribunalesService.update(Number((editing as any).id_tribunal), payload);
        showToast("Tribunal actualizado.", "success");
      }

      setShowFormModal(false);
      resetTribunalForm();
      await loadAll();
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.userMessage ||
        "No se pudo guardar el tribunal.";
      showToast(String(msg), "error");
    } finally {
      setSavingTribunal(false);
    }
  }

  // ===== ASIGNACIÓN Tribunal–Estudiante =====
  async function openAsignaciones(t: Tribunal) {
    setActiveTribunalForAsign(t);
    setAsignForm({ id_estudiante: "", id_franja_horario: "" });
    setErrors({});
    setEligibleEstudiantes([]);
    setEstudiantesAll([]);

    try {
      setLoading(true);

      const [a, est, fr] = await Promise.all([
        tribunalEstudiantesService.list({
          tribunalId: Number((t as any).id_tribunal),
          includeInactive: true,
        }),
        estudiantesService.list({
          carreraPeriodoId: Number((t as any).id_carrera_periodo),
          includeInactive: false,
          page: 1,
          limit: 200,
        }),
        franjaHorarioService.list({
          carreraPeriodoId: Number((t as any).id_carrera_periodo),
          includeInactive: false,
          page: 1,
          limit: 200,
        }),
      ]);

      setAsignaciones(a ?? []);
      setEstudiantesAll(est ?? []);
      setFranjas(fr ?? []);
      setShowAsignModal(true);

      // ✅ FILTRO: solo estudiantes con caso asignado (para evitar 422 del backend)
      setLoadingEligible(true);
      try {
        const results = await Promise.all(
          (est ?? []).map(async (e) => {
            try {
              const asg = await estudiantesService.getAsignaciones(Number(e.id_estudiante));
              return asg?.caso ? e : null;
            } catch {
              return null;
            }
          })
        );
        const elig = results.filter(Boolean) as Estudiante[];
        setEligibleEstudiantes(elig);

        // si el seleccionado no es elegible, reset
        setAsignForm((p) => ({
          ...p,
          id_estudiante: elig.some((x) => Number(x.id_estudiante) === Number(p.id_estudiante)) ? p.id_estudiante : "",
        }));

        if (elig.length === 0) {
          showToast("No hay estudiantes con caso asignado. Primero asigna caso al estudiante.", "info");
        }
      } finally {
        setLoadingEligible(false);
      }
    } catch {
      showToast("No se pudo cargar datos para asignación.", "error");
    } finally {
      setLoading(false);
    }
  }

  function validateAsignForm(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!activeTribunalForAsign) e.tribunal = "No hay tribunal seleccionado.";

    if (loadingEligible) {
      e.id_estudiante = "Espere: verificando casos asignados...";
      return e;
    }

    if (!eligibleEstudiantes.length) {
      e.id_estudiante = "No hay estudiantes elegibles (sin caso asignado).";
      return e;
    }

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
      });
      setAsignaciones(a ?? []);
      setAsignForm({ id_estudiante: "", id_franja_horario: "" });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.userMessage || "No se pudo crear la asignación.";
      showToast(String(msg), "error");
    } finally {
      setLoading(false);
    }
  }

  async function onToggleAsignEstado(row: TribunalEstudiante) {
    try {
      setLoading(true);
      const current = estado01((row as any).estado);

      await tribunalEstudiantesService.toggleEstado(Number((row as any).id_tribunal_estudiante), current as 0 | 1);

      showToast(current === 1 ? "Asignación desactivada." : "Asignación activada.", "success");

      if (activeTribunalForAsign) {
        const a = await tribunalEstudiantesService.list({
          tribunalId: Number((activeTribunalForAsign as any).id_tribunal),
          includeInactive: true,
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

  // ===== GUARDAR CALIFICADORES GENERALES =====
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

      for (const r of toRemove) await calificadoresGeneralesService.remove(Number(r.id_cp_calificador_general));
      for (const id_carrera_docente of toAdd)
        await calificadoresGeneralesService.create(Number(selectedCP), { id_carrera_docente });

      showToast("Calificadores generales guardados.", "success");
      await loadPlanAndCalificadores();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.userMessage || "No se pudo guardar calificadores generales.";
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
          <button className="heroBtn primary" onClick={openCreateModal}>
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
                setActiveCarreraPeriodoId(typeof next === "number" ? next : null);
              }}
            >
              <option value="">Seleccione Carrera–Período...</option>
              {carreraPeriodos.map((cp: any) => (
                <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                  {(cp.nombre_carrera ?? "Carrera") + " — " + (cp.codigo_periodo ?? cp.descripcion_periodo ?? "Período")}
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

        <div className="muted" style={{ marginTop: 10 }}>
          Total: <b>{total}</b> · Activos: <b>{activos}</b> · Inactivos: <b>{inactivos}</b>
        </div>
      </div>

      {/* TOP GRID (Plan + Calificadores) */}
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
              <select className="select" value={cg1} onChange={(e) => setCg1(e.target.value ? Number(e.target.value) : "")}>
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
              <select className="select" value={cg2} onChange={(e) => setCg2(e.target.value ? Number(e.target.value) : "")}>
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
              <select className="select" value={cg3} onChange={(e) => setCg3(e.target.value ? Number(e.target.value) : "")}>
                <option value="">-- Sin asignar --</option>
                {docentes.map((cd: any) => (
                  <option key={cd.id_carrera_docente} value={cd.id_carrera_docente}>
                    {(cd.apellidos_docente ?? "") + " " + (cd.nombres_docente ?? "")}
                  </option>
                ))}
              </select>
            </div>

            <button className="btnPrimary btnBlock" onClick={onSaveCalificadoresGenerales} disabled={!selectedCP || savingCG}>
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
                        <div className="tdSub">{t.nombre_carrera ? `${t.nombre_carrera} — ${t.codigo_periodo ?? ""}` : "—"}</div>
                      </td>
                      <td>{t.caso == null ? <span className="muted">—</span> : t.caso}</td>
                      <td>
                        <span className={`badge ${activo ? "badgeActive" : "badgeInactive"}`}>{activo ? "Activo" : "Inactivo"}</span>
                      </td>
                      <td className="tdActions">
                        <div className="actions">
                          <button className="iconBtn iconBtn_neutral" onClick={() => openView(t)}>
                            <Eye className="iconAction" />
                            <span className="tooltip">Ver</span>
                          </button>

                          <button className="iconBtn iconBtn_purple" onClick={() => openEditModal(t)}>
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
          <button className="btnGhost" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Anterior
          </button>
          <span className="paginationText">
            Página <b>{currentPage}</b> de <b>{totalPages}</b>
          </span>
          <button className="btnGhost" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Siguiente
          </button>
        </div>
      </div>

      {/* MODAL CREAR/EDITAR */}
      {showFormModal && (
        <div className="modalOverlay" onMouseDown={() => setShowFormModal(false)}>
          <div className="modalCard modalWide" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3 className="modalTitle">{editing ? "Editar Tribunal" : "Crear Tribunal"}</h3>
              <button className="btnClose" onClick={() => setShowFormModal(false)} aria-label="Cerrar" type="button">
                <X size={18} />
              </button>
            </div>

            <div className="modalBody">
              <div className="grid2">
                <div className="field full">
                  <label className="fieldLabel">Nombre del tribunal</label>
                  <input
                    className="input"
                    value={tribunalForm.nombre_tribunal}
                    onChange={(e) => setTribunalForm((p) => ({ ...p, nombre_tribunal: e.target.value }))}
                    placeholder="Ej: Tribunal 1"
                  />
                  {formErrors.nombre_tribunal ? <p className="error">{formErrors.nombre_tribunal}</p> : null}
                </div>

                <div className="field">
                  <label className="fieldLabel">Caso (opcional)</label>
                  <input
                    className="input"
                    value={tribunalForm.caso}
                    onChange={(e) => setTribunalForm((p) => ({ ...p, caso: e.target.value }))}
                    placeholder="Ej: 1"
                  />
                  {formErrors.caso ? <p className="error">{formErrors.caso}</p> : null}
                </div>

                <div className="field full">
                  <label className="fieldLabel">Descripción (opcional)</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={tribunalForm.descripcion_tribunal}
                    onChange={(e) => setTribunalForm((p) => ({ ...p, descripcion_tribunal: e.target.value }))}
                    placeholder="Descripción del tribunal..."
                  />
                </div>

                <div className="field">
                  <label className="fieldLabel">Presidente</label>
                  <select
                    className="select"
                    value={tribunalForm.presidente}
                    onChange={(e) => setTribunalForm((p) => ({ ...p, presidente: e.target.value ? Number(e.target.value) : "" }))}
                  >
                    <option value="">Seleccione...</option>
                    {docentes.map((cd: any) => (
                      <option key={cd.id_carrera_docente} value={cd.id_carrera_docente}>
                        {(cd.apellidos_docente ?? "") + " " + (cd.nombres_docente ?? "")}
                      </option>
                    ))}
                  </select>
                  {formErrors.presidente ? <p className="error">{formErrors.presidente}</p> : null}
                </div>

                <div className="field">
                  <label className="fieldLabel">Integrante 1</label>
                  <select
                    className="select"
                    value={tribunalForm.integrante1}
                    onChange={(e) => setTribunalForm((p) => ({ ...p, integrante1: e.target.value ? Number(e.target.value) : "" }))}
                  >
                    <option value="">Seleccione...</option>
                    {docentes.map((cd: any) => (
                      <option key={cd.id_carrera_docente} value={cd.id_carrera_docente}>
                        {(cd.apellidos_docente ?? "") + " " + (cd.nombres_docente ?? "")}
                      </option>
                    ))}
                  </select>
                  {formErrors.integrante1 ? <p className="error">{formErrors.integrante1}</p> : null}
                </div>

                <div className="field">
                  <label className="fieldLabel">Integrante 2</label>
                  <select
                    className="select"
                    value={tribunalForm.integrante2}
                    onChange={(e) => setTribunalForm((p) => ({ ...p, integrante2: e.target.value ? Number(e.target.value) : "" }))}
                  >
                    <option value="">Seleccione...</option>
                    {docentes.map((cd: any) => (
                      <option key={cd.id_carrera_docente} value={cd.id_carrera_docente}>
                        {(cd.apellidos_docente ?? "") + " " + (cd.nombres_docente ?? "")}
                      </option>
                    ))}
                  </select>
                  {formErrors.integrante2 ? <p className="error">{formErrors.integrante2}</p> : null}
                </div>

                {formErrors.docentes ? <p className="error">{formErrors.docentes}</p> : null}

                <div className="field full">
                  <button className="btnPrimary" onClick={onSaveTribunal} disabled={savingTribunal} type="button">
                    <Save size={18} /> {savingTribunal ? "Guardando..." : "Guardar Tribunal"}
                  </button>
                </div>
              </div>
            </div>

            <div className="modalFooter">
              <button className="btnGhost" onClick={() => setShowFormModal(false)} disabled={savingTribunal} type="button">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIEW */}
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
        // ✅ PASAMOS SOLO ELEGIBLES (con caso asignado)
        estudiantes={eligibleEstudiantes}
        franjas={franjas}
        asignaciones={asignaciones}
        errors={errors}
        // loading incluye también verificación
        loading={loading || loadingEligible}
        onCreateAsignacion={onCreateAsignacion}
        onToggleAsignEstado={onToggleAsignEstado}
        isActivo={isActivo}
      />
    </div>
  );
}
