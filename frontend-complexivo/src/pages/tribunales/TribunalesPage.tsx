// ✅ src/pages/tribunales/TribunalesPage.tsx
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
  Filter,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./TribunalesPage.css";

import escudoESPE from "../../assets/escudo.png";

import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { Estudiante } from "../../types/estudiante";
import type { FranjaHorario } from "../../types/franjaHoraria";
import type { CarreraDocente } from "../../types/carreraDocente";
import type { CasoEstudio } from "../../types/casoEstudio";

import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { estudiantesService } from "../../services/estudiantes.service";
import { franjaHorarioService } from "../../services/franjasHorarias.service";
import { casosEstudioService } from "../../services/casosEstudio.service";
import {
  tribunalesService,
  type TribunalCreateDTO,
  type TribunalUpdateDTO,
} from "../../services/tribunales.service";
import { tribunalEstudiantesService } from "../../services/tribunalEstudiantes.service";

import { carreraDocenteService } from "../../services/carreraDocente.service";
import { docentesService } from "../../services/docentes.service";
import { carrerasService } from "../../services/carreras.service";

import { planEvaluacionService } from "../../services/planEvaluacion.service";
import { calificadoresGeneralesService } from "../../services/calificadoresGenerales.service";

import TribunalAsignacionesModal from "./TribunalAsignacionesModal";
import TribunalViewModal from "./TribunalViewModal";
import TribunalFormModal from "./TribunalFormModal";

import { setActiveCarreraPeriodoId } from "../../api/axiosClient";

const PAGE_SIZE = 10;

type ToastType = "success" | "error" | "info";

type AsignacionFormState = {
  id_estudiante: number | "";
  id_franja_horario: number | "";
  id_caso_estudio: number | ""; // ✅ caso en tribunal_estudiante
};

type TribunalFormState = {
  nombre_tribunal: string;
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

  // ===== MODAL VIEW =====
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTribunal, setViewTribunal] = useState<Tribunal | null>(null);

  // ===== MODAL FORM (crear/editar) =====
  const [showFormModal, setShowFormModal] = useState(false);
  const [editing, setEditing] = useState<Tribunal | null>(null);
  const [savingTribunal, setSavingTribunal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [tribunalForm, setTribunalForm] = useState<TribunalFormState>({
    nombre_tribunal: "",
    descripcion_tribunal: "",
    presidente: "",
    integrante1: "",
    integrante2: "",
  });

  // ===== MODAL ASIGNACIONES =====
  const [showAsignModal, setShowAsignModal] = useState(false);
  const [activeTribunalForAsign, setActiveTribunalForAsign] = useState<Tribunal | null>(null);

  const [asignaciones, setAsignaciones] = useState<TribunalEstudiante[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [franjas, setFranjas] = useState<FranjaHorario[]>([]);
  const [casos, setCasos] = useState<CasoEstudio[]>([]);

  const [asignForm, setAsignForm] = useState<AsignacionFormState>({
    id_estudiante: "",
    id_franja_horario: "",
    id_caso_estudio: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  // ===== HELPERS =====
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message ?? err?.data?.message ?? err?.userMessage;
    const list = err?.response?.data?.errors;
    if (Array.isArray(list) && list.length) {
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;
    return "Ocurrió un error";
  }

  function estado01(v: any): 0 | 1 {
    return Number(v) === 1 ? 1 : 0;
  }
  function isActivo(v: any): boolean {
    return estado01(v) === 1;
  }

  const selectedCPLabel = useMemo(() => {
    const cp = carreraPeriodos.find((x: any) => Number(x.id_carrera_periodo) === Number(selectedCP));
    if (!cp) return "";
    const carrera = (cp as any).nombre_carrera ?? "Carrera";
    const periodo = (cp as any).codigo_periodo ?? (cp as any).descripcion_periodo ?? "Período";
    return `${carrera} — ${periodo}`;
  }, [carreraPeriodos, selectedCP]);

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
      setActiveCarreraPeriodoId(Number(selectedCP));
      loadAll();
      loadDocentesByCP();
      loadPlanAndCalificadores();
      setPage(1);
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

  useEffect(() => {
    setPage(1);
  }, [search]);

  async function loadCarreraPeriodos() {
    try {
      setLoading(true);
      const cps = await carreraPeriodoService.list(false);
      setCarreraPeriodos(cps ?? []);

      const savedRaw = localStorage.getItem("active_carrera_periodo_id");
      const saved = savedRaw ? Number(savedRaw) : 0;

      const savedExists =
        saved > 0 &&
        (cps ?? []).some(
          (x: any) =>
            Number(x.id_carrera_periodo) === saved &&
            Number((x as any).estado_cp ?? (x as any).estado ?? 1) === 1
        );

      if (savedExists) {
        setSelectedCP(saved);
        setActiveCarreraPeriodoId(saved);
        return;
      }

      const first =
        (cps ?? []).find((x: any) => Number((x as any).estado_cp ?? (x as any).estado ?? 1) === 1) ?? (cps ?? [])[0];

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

      // 1) intentamos carrera_docente
      let cds = await carreraDocenteService.list({ includeInactive: false, carreraId });
      if ((cds ?? []).length > 0) {
        setDocentes(cds ?? []);
        return;
      }

      // 2) fallback: docentes por departamento y crear carrera_docente
      const carreras = await carrerasService.list(false);
      const carrera = (carreras ?? []).find((c: any) => Number(c.id_carrera) === Number(carreraId)) ?? null;

      const deptId =
        Number((carrera as any)?.id_departamento) ||
        Number((carrera as any)?.departamento_id) ||
        Number((carrera as any)?.departamento?.id_departamento) ||
        0;

      if (!deptId) {
        setDocentes([]);
        showToast("No hay carrera_docente y no pude obtener el departamento de la carrera.", "error");
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

      for (const d of activos) {
        try {
          await carreraDocenteService.create({
            id_docente: Number((d as any).id_docente),
            id_carrera: Number(carreraId),
            tipo_admin: "DOCENTE",
          });
        } catch {
          // ignore
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
        limit: 200,
      });
      setTribunales(data ?? []);
    } catch {
      showToast("Error al cargar tribunales", "error");
      setTribunales([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlanAndCalificadores() {
    if (!selectedCP) return;

    // Plan
    try {
      setLoadingPlan(true);
      const p = await planEvaluacionService.getByCP();
      setPlan(p);
    } catch {
      setPlan(null);
    } finally {
      setLoadingPlan(false);
    }

    // Calificadores
    try {
      const rows = await calificadoresGeneralesService.list(false);
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
        return String(t.nombre_tribunal || "").toLowerCase().includes(q);
      });
  }, [tribunales, search, mostrarInactivos]);

  const total = filtered.length;
  const activos = filtered.filter((x: any) => isActivo(x.estado)).length;
  const inactivos = total - activos;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ===== FORM MODAL =====
  function resetTribunalForm() {
    setTribunalForm({
      nombre_tribunal: "",
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

  async function openEditModal(t: Tribunal) {
    try {
      setLoading(true);
      setEditing(t);
      setFormErrors({});

      const full = await tribunalesService.get(Number((t as any).id_tribunal));
      const docs = (full as any)?.docentes ?? [];

      const pres = docs.find((d: any) => d.designacion === "PRESIDENTE");
      const i1 = docs.find((d: any) => d.designacion === "INTEGRANTE_1");
      const i2 = docs.find((d: any) => d.designacion === "INTEGRANTE_2");

      setTribunalForm({
        nombre_tribunal: String((full as any).nombre_tribunal || ""),
        descripcion_tribunal: String((full as any).descripcion_tribunal || ""),
        presidente: pres?.id_carrera_docente ? Number(pres.id_carrera_docente) : "",
        integrante1: i1?.id_carrera_docente ? Number(i1.id_carrera_docente) : "",
        integrante2: i2?.id_carrera_docente ? Number(i2.id_carrera_docente) : "",
      });

      setShowFormModal(true);
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
    } finally {
      setLoading(false);
    }
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

      if (!editing) {
        const payload: TribunalCreateDTO = {
          id_carrera_periodo: Number(selectedCP),
          nombre_tribunal: tribunalForm.nombre_tribunal.trim(),
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
      showToast(extractBackendError(err), "error");
    } finally {
      setSavingTribunal(false);
    }
  }

  // ===== ASIGNACIONES =====
  async function openAsignaciones(t: Tribunal) {
    setActiveTribunalForAsign(t);
    setAsignForm({ id_estudiante: "", id_franja_horario: "", id_caso_estudio: "" });
    setErrors({});
    setEstudiantes([]);
    setFranjas([]);
    setCasos([]);
    setAsignaciones([]);

    try {
      setLoading(true);

      const [a, est, fr, cs] = await Promise.all([
        tribunalEstudiantesService.list({
          tribunalId: Number((t as any).id_tribunal),
          includeInactive: true,
          page: 1,
          limit: 200,
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
        casosEstudioService.list({ includeInactive: false }),
      ]);

      setAsignaciones(a ?? []);
      setEstudiantes(est ?? []);
      setFranjas(fr ?? []);
      setCasos(cs ?? []);

      setShowAsignModal(true);
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
      setShowAsignModal(false);
    } finally {
      setLoading(false);
    }
  }

  function validateAsignForm(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!activeTribunalForAsign) e.tribunal = "No hay tribunal seleccionado.";
    if (!asignForm.id_estudiante) e.id_estudiante = "Seleccione un estudiante.";
    if (!asignForm.id_franja_horario) e.id_franja_horario = "Seleccione una franja horaria.";
    if (!asignForm.id_caso_estudio) e.id_caso_estudio = "Seleccione un caso de estudio.";
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
        id_caso_estudio: Number(asignForm.id_caso_estudio),
      });

      showToast("Asignación creada.", "success");

      const a = await tribunalEstudiantesService.list({
        tribunalId: Number((activeTribunalForAsign as any).id_tribunal),
        includeInactive: true,
        page: 1,
        limit: 200,
      });

      setAsignaciones(a ?? []);
      setAsignForm({ id_estudiante: "", id_franja_horario: "", id_caso_estudio: "" });
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
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
          limit: 200,
        });
        setAsignaciones(a ?? []);
      }
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  // ✅ NUEVO: cierre / reapertura (defensa)
  async function onToggleCierre(row: TribunalEstudiante) {
    try {
      setLoading(true);
      const cerradoActual = estado01((row as any).cerrado);
      const next = cerradoActual === 1 ? false : true;

      await tribunalEstudiantesService.setCierre(Number(row.id_tribunal_estudiante), next);

      showToast(next ? "Defensa cerrada." : "Defensa reabierta.", "success");

      if (activeTribunalForAsign) {
        const a = await tribunalEstudiantesService.list({
          tribunalId: Number((activeTribunalForAsign as any).id_tribunal),
          includeInactive: true,
          page: 1,
          limit: 200,
        });
        setAsignaciones(a ?? []);
      }
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
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
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  // ===== CALIFICADORES GENERALES =====
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

      const currentRows = await calificadoresGeneralesService.list(false);
      const currentActive = (currentRows ?? []).map((r: any) => ({
        id_cp_calificador_general: Number(r.id_cp_calificador_general),
        id_carrera_docente: Number(r.id_carrera_docente),
      }));

      const currentIds = new Set(currentActive.map((x: any) => x.id_carrera_docente));
      const desiredIds = new Set(desired);

      const toRemove = currentActive.filter((x: any) => !desiredIds.has(x.id_carrera_docente));
      const toAdd = desired.filter((id) => !currentIds.has(id));

      for (const r of toRemove) await calificadoresGeneralesService.remove(Number(r.id_cp_calificador_general));
      for (const id_carrera_docente of toAdd) {
        await calificadoresGeneralesService.create({ id_carrera_docente });
      }

      showToast("Calificadores generales guardados.", "success");
      await loadPlanAndCalificadores();
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
    } finally {
      setSavingCG(false);
    }
  }

  return (
    <div className="tribunalesPage">
      <div className="wrap">
        {/* ✅ HERO alineado estilo ESPE */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Tribunales</h1>
              <p className="heroSubtitle">
                Gestión de tribunales y asignación de estudiantes por franja horaria.{" "}
                <b>{selectedCPLabel || "Seleccione Carrera–Período"}</b>
              </p>
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn primary" onClick={openCreateModal} disabled={!selectedCP || loading}>
              <Plus className="heroBtnIcon" /> Añadir tribunal
            </button>
          </div>
        </div>

        {/* BOX PRINCIPAL */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <Users size={18} />
              </span>
              Listado de tribunales
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre de tribunal..."
                disabled={!selectedCP}
              />
            </div>

            <div className="filterWrap">
              <Filter className="filterIcon" />
              <select
                className="select"
                value={selectedCP}
                onChange={(e) => {
                  const next = e.target.value ? Number(e.target.value) : "";
                  setSelectedCP(next);
                  setActiveCarreraPeriodoId(typeof next === "number" ? next : null);
                }}
                disabled={loading}
                title="Seleccione Carrera–Período"
              >
                <option value="">Seleccione Carrera–Período</option>
                {carreraPeriodos.map((cp: any) => (
                  <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                    {(cp.nombre_carrera ?? "Carrera") + " — " + (cp.codigo_periodo ?? cp.descripcion_periodo ?? "Período")}
                  </option>
                ))}
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
                  <th>Tribunal</th>
                  <th>Estado</th>
                  <th style={{ width: 220 }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!selectedCP ? (
                  <tr>
                    <td colSpan={3} className="emptyCell">
                      <div className="empty">Seleccione una Carrera–Período para ver tribunales.</div>
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={3} className="emptyCell">
                      <div className="empty">Cargando...</div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="emptyCell">
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
                            {t.nombre_carrera ? `${t.nombre_carrera} — ${t.codigo_periodo ?? ""}` : selectedCPLabel || "—"}
                          </div>
                        </td>

                        <td>
                          {activo ? <span className="badgeActive">Activo</span> : <span className="badgeInactive">Inactivo</span>}
                        </td>

                        <td className="tdActions">
                          <div className="actions">
                            <button className="iconBtn iconBtn_neutral" onClick={() => openView(t)} type="button">
                              <Eye className="iconAction" />
                              <span className="tooltip">Ver</span>
                            </button>

                            <button className="iconBtn iconBtn_purple" onClick={() => openEditModal(t)} type="button">
                              <Pencil className="iconAction" />
                              <span className="tooltip">Editar</span>
                            </button>

                            <button className="iconBtn iconBtn_primary" onClick={() => onToggleEstado(t)} type="button">
                              {activo ? <ToggleRight className="iconAction" /> : <ToggleLeft className="iconAction" />}
                              <span className="tooltip">{activo ? "Desactivar" : "Activar"}</span>
                            </button>

                            <button className="iconBtn iconBtn_neutral" onClick={() => openAsignaciones(t)} type="button">
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

          {/* PAGINATION */}
          <div className="paginationRow">
            <button className="btnGhost" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ← Anterior
            </button>

            <span className="paginationText">
              Página {currentPage} de {totalPages}
            </span>

            <button
              className="btnGhost"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente →
            </button>
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
                <button className="btnWarn" onClick={() => navigate(`/plan-evaluacion?cp=${selectedCP}`)} disabled={!selectedCP}>
                  Configurar Plan Ahora
                </button>
              </div>
            ) : (
              <div className="planInfo">
                <p className="muted">
                  Plan activo: <b>{plan.nombre_plan ?? "Plan de evaluación"}</b>
                </p>
                {plan.descripcion_plan ? <p className="muted">{plan.descripcion_plan}</p> : null}
                <button className="btnGhost" onClick={() => navigate(`/plan-evaluacion?cp=${selectedCP}`)} disabled={!selectedCP}>
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
      </div>

      {/* MODAL FORM */}
      <TribunalFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        editing={editing}
        docentes={docentes}
        selectedCPLabel={selectedCPLabel || ""}
        tribunalForm={tribunalForm}
        setTribunalForm={setTribunalForm}
        formErrors={formErrors}
        saving={savingTribunal}
        onSave={onSaveTribunal}
      />

      {/* MODAL VIEW */}
      <TribunalViewModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        tribunal={viewTribunal}
        cpLabel={selectedCPLabel || ""}
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
        casos={casos}
        asignaciones={asignaciones}
        errors={errors}
        loading={loading}
        onCreateAsignacion={onCreateAsignacion}
        onToggleAsignEstado={onToggleAsignEstado}
        // ✅ si tu modal ya tiene botones de cierre, pásale esto:
        // onToggleCierre={onToggleCierre}
        isActivo={isActivo}
      />

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
