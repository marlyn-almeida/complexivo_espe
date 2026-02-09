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
  Gavel,
  FlaskConical,
  BadgeCheck,
  BadgeX,
  ArrowUpAZ,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./TribunalesPage.css";

import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante, Estado01 } from "../../types/tribunalEstudiante";
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
import {
  tribunalEstudiantesService,
  type TribunalEstudianteCreateDTO,
} from "../../services/tribunalEstudiantes.service";

import { carreraDocenteService } from "../../services/carreraDocente.service";
import { docentesService } from "../../services/docentes.service";
import { carrerasService } from "../../services/carreras.service";

import { planEvaluacionService } from "../../services/planEvaluacion.service";
import { calificadoresGeneralesService } from "../../services/calificadoresGenerales.service";

import TribunalAsignacionesModal from "./TribunalAsignacionesModal";
import TribunalViewModal from "./TribunalViewModal";
import TribunalFormModal from "./TribunalFormModal";

import { setActiveCarreraPeriodoId } from "../../api/axiosClient";
import escudoESPE from "../../assets/escudo.png";

const PAGE_SIZE = 10;
type ToastType = "success" | "error" | "info";

type AsignacionFormState = {
  id_estudiante: number | "";
  id_franja_horario: number | "";
  id_caso_estudio: number | "";
};

type TribunalFormState = {
  nombre_tribunal: string;
  descripcion_tribunal: string;
  presidente: number | "";
  integrante1: number | "";
  integrante2: number | "";
};

// ✅ ViewModel para “Individuales” y “Plantillas”
type TribunalRowVM = {
  id_tribunal: number;
  nombre_tribunal: string;
  estado_activo: 0 | 1;

  // UI chips
  miembros: Array<{ label: string; role: "PRESIDENTE" | "INT1" | "INT2" }>;

  // si tiene asignaciones => Individual (true), si no => Plantilla (false)
  hasAsignaciones: boolean;

  // Individuales (si aplica)
  lab: string;
  estudiante: string; // "Apellidos Nombres"
  institucional: string; // "L00..."
  fecha: string; // "09/02/2026"
  horario: string; // "20:37 - 23:37"
  caso: string; // "5" o "-"
  cerrado: boolean | null; // null si no tiene asignaciones; true/false si tiene
};

function normalizeEstado01(v: any): 0 | 1 {
  return Number(v) === 1 ? 1 : 0;
}
function isActivo(v: any): boolean {
  return normalizeEstado01(v) === 1;
}

function safeStr(v: any, fallback = "") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

function getLabFromAsignRow(r: any): string {
  const candidates = [
    r?.laboratorio,
    r?.lab,
    r?.aula,
    r?.nombre_laboratorio,
    r?.codigo_laboratorio,
    r?.franja?.laboratorio,
    r?.franja?.lab,
    r?.franja?.aula,
    r?.franja?.nombre_laboratorio,
    r?.franja?.codigo_laboratorio,
  ]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);

  return candidates[0] || "-";
}

function getFechaHoraFromAsignRow(r: any): { fecha: string; horario: string } {
  const fecha = safeStr(r?.fecha, "-");
  const hi = safeStr(r?.hora_inicio, "");
  const hf = safeStr(r?.hora_fin, "");
  const horario = hi && hf ? `${hi} - ${hf}` : "-";
  return { fecha, horario };
}

function getCasoFromAsignRow(r: any): string {
  const numero =
    r?.numero_caso ??
    r?.caso_numero ??
    r?.c.numero_caso ??
    r?.caso?.numero_caso ??
    null;

  if (numero === null || numero === undefined || numero === "") return r?.id_caso_estudio ? String(r.id_caso_estudio) : "-";
  return String(numero);
}

function getEstudianteFromAsignRow(r: any): { estudiante: string; institucional: string } {
  const ap = safeStr(r?.apellidos_estudiante, "");
  const no = safeStr(r?.nombres_estudiante, "");
  const estudiante = (ap || no) ? `${ap} ${no}`.trim() : (r?.id_estudiante ? `ID ${r.id_estudiante}` : "-");
  const institucional = safeStr(r?.id_institucional_estudiante, "-");
  return { estudiante, institucional };
}

export default function TribunalesPage() {
  const navigate = useNavigate();

  // ===== DATA =====
  const [carreraPeriodos, setCarreraPeriodos] = useState<CarreraPeriodo[]>([]);
  const [selectedCP, setSelectedCP] = useState<number | "">("");

  const [tribunales, setTribunales] = useState<Tribunal[]>([]);
  const [docentes, setDocentes] = useState<CarreraDocente[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ ViewModel
  const [rowsVM, setRowsVM] = useState<TribunalRowVM[]>([]);
  const [loadingVM, setLoadingVM] = useState(false);

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

  // ✅ paginación separada
  const [pageInd, setPageInd] = useState(1);
  const [pageTpl, setPageTpl] = useState(1);

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

  // ✅ modo plantilla vs individual (solo CREATE)
  const [modoIndividual, setModoIndividual] = useState(false);
  const [individualForm, setIndividualForm] = useState<AsignacionFormState>({
    id_estudiante: "",
    id_franja_horario: "",
    id_caso_estudio: "",
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

  const selectedCPLabel = useMemo(() => {
    const cp = carreraPeriodos.find((x: any) => Number(x.id_carrera_periodo) === Number(selectedCP));
    if (!cp) return "";
    const carrera = (cp as any).nombre_carrera ?? "Carrera";
    const periodo = (cp as any).codigo_periodo ?? (cp as any).descripcion_periodo ?? "Período";
    return `${carrera} — ${periodo}`;
  }, [carreraPeriodos, selectedCP]);

  function openView(t: any) {
    // t puede ser VM, pero el ViewModal usa Tribunal real: buscamos por id
    const id = Number(t?.id_tribunal);
    const base = tribunales.find((x: any) => Number(x.id_tribunal) === id) ?? (t as any);
    setViewTribunal(base as any);
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
      setPageInd(1);
      setPageTpl(1);
    } else {
      setTribunales([]);
      setRowsVM([]);
      setDocentes([]);
      setPlan(null);
      setCg1("");
      setCg2("");
      setCg3("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCP, mostrarInactivos]);

  useEffect(() => {
    setPageInd(1);
    setPageTpl(1);
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
      const cp: any = carreraPeriodos.find((x: any) => Number(x.id_carrera_periodo) === Number(selectedCP)) ?? null;

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
        limit: 300,
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
        limit: 500,
      });
      const list = data ?? [];
      setTribunales(list);

      await buildTableVM(list);
    } catch {
      showToast("Error al cargar tribunales", "error");
      setTribunales([]);
      setRowsVM([]);
    } finally {
      setLoading(false);
    }
  }

  async function buildTableVM(list: Tribunal[]) {
    // para no saturar, enriquecemos N
    const MAX_ENRICH = 80;
    const slice = (list ?? []).slice(0, MAX_ENRICH);

    setLoadingVM(true);
    try {
      const vms = await Promise.all(
        slice.map(async (t: any): Promise<TribunalRowVM> => {
          const idTrib = Number(t.id_tribunal);

          // 1) miembros
          let miembros: TribunalRowVM["miembros"] = [];
          try {
            const full = await tribunalesService.get(idTrib);
            const docs = (full as any)?.docentes ?? [];

            const pres = docs.find((d: any) => d.designacion === "PRESIDENTE");
            const i1 = docs.find((d: any) => d.designacion === "INTEGRANTE_1");
            const i2 = docs.find((d: any) => d.designacion === "INTEGRANTE_2");

            const fmt = (d: any) =>
              `${String(d?.apellidos_docente ?? "").trim()} ${String(d?.nombres_docente ?? "").trim()}`.trim();

            miembros = [
              pres ? { label: `${fmt(pres)} (Presidente)`, role: "PRESIDENTE" } : null,
              i1 ? { label: `${fmt(i1)} (Int. 1)`, role: "INT1" } : null,
              i2 ? { label: `${fmt(i2)} (Int. 2)`, role: "INT2" } : null,
            ].filter(Boolean) as any;
          } catch {
            miembros = [];
          }

          // 2) datos individuales desde asignaciones
          let hasAsignaciones = false;
          let lab = "-";
          let cerrado: boolean | null = null;
          let estudiante = "-";
          let institucional = "-";
          let fecha = "-";
          let horario = "-";
          let caso = "-";

          try {
            const asign = await tribunalEstudiantesService.list({
              tribunalId: idTrib,
              includeInactive: true,
              page: 1,
              limit: 300,
            });

            const rows = asign ?? [];
            if (rows.length) {
              hasAsignaciones = true;

              const firstActive = rows.find((r: any) => normalizeEstado01(r?.estado ?? 1) === 1) ?? rows[0];

              lab = getLabFromAsignRow(firstActive);
              ({ fecha, horario } = getFechaHoraFromAsignRow(firstActive));
              caso = getCasoFromAsignRow(firstActive);
              ({ estudiante, institucional } = getEstudianteFromAsignRow(firstActive));

              const anyClosedActive = rows.some(
                (r: any) => normalizeEstado01(r?.estado ?? 1) === 1 && normalizeEstado01(r?.cerrado ?? 0) === 1
              );
              cerrado = anyClosedActive ? true : false;
            } else {
              hasAsignaciones = false;
              cerrado = null;
            }
          } catch {
            hasAsignaciones = false;
            lab = "-";
            cerrado = null;
          }

          return {
            id_tribunal: idTrib,
            nombre_tribunal: String(t.nombre_tribunal ?? `Tribunal ${idTrib}`),
            estado_activo: normalizeEstado01(t.estado),
            miembros,
            hasAsignaciones,

            lab,
            estudiante,
            institucional,
            fecha,
            horario,
            caso,
            cerrado,
          };
        })
      );

      const rest = (list ?? []).slice(MAX_ENRICH).map((t: any) => ({
        id_tribunal: Number(t.id_tribunal),
        nombre_tribunal: String(t.nombre_tribunal ?? `Tribunal ${t.id_tribunal}`),
        estado_activo: normalizeEstado01(t.estado),
        miembros: [],
        hasAsignaciones: false,

        lab: "-",
        estudiante: "-",
        institucional: "-",
        fecha: "-",
        horario: "-",
        caso: "-",
        cerrado: null,
      }));

      const all = [...vms, ...rest].sort((a, b) => a.id_tribunal - b.id_tribunal); // ✅ Id (A-Z)
      setRowsVM(all);
    } finally {
      setLoadingVM(false);
    }
  }

  async function loadPlanAndCalificadores() {
    if (!selectedCP) return;

    try {
      setLoadingPlan(true);
      const p = await planEvaluacionService.getByCP();
      setPlan(p);
    } catch {
      setPlan(null);
    } finally {
      setLoadingPlan(false);
    }

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

  // ===== FILTRO (común) =====
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (rowsVM ?? [])
      .filter((t) => (mostrarInactivos ? true : t.estado_activo === 1))
      .filter((t) => {
        if (!q) return true;
        // búsqueda “tipo captura”: tribunal / estudiante / fecha
        return (
          String(t.nombre_tribunal || "").toLowerCase().includes(q) ||
          String(t.estudiante || "").toLowerCase().includes(q) ||
          String(t.fecha || "").toLowerCase().includes(q)
        );
      });
  }, [rowsVM, search, mostrarInactivos]);

  const individuales = useMemo(() => filtered.filter((x) => x.hasAsignaciones), [filtered]);
  const plantillas = useMemo(() => filtered.filter((x) => !x.hasAsignaciones), [filtered]);

  const total = filtered.length;
  const totalInd = individuales.length;
  const totalTpl = plantillas.length;

  // paginación separada
  const totalPagesInd = Math.max(1, Math.ceil(totalInd / PAGE_SIZE));
  const currentPageInd = Math.min(pageInd, totalPagesInd);
  const paginatedInd = individuales.slice((currentPageInd - 1) * PAGE_SIZE, currentPageInd * PAGE_SIZE);

  const totalPagesTpl = Math.max(1, Math.ceil(totalTpl / PAGE_SIZE));
  const currentPageTpl = Math.min(pageTpl, totalPagesTpl);
  const paginatedTpl = plantillas.slice((currentPageTpl - 1) * PAGE_SIZE, currentPageTpl * PAGE_SIZE);

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

  async function loadListasParaCrear() {
    if (!selectedCP) return;

    try {
      const [est, fr, cs] = await Promise.all([
        estudiantesService.list({
          carreraPeriodoId: Number(selectedCP),
          includeInactive: false,
          page: 1,
          limit: 500,
        }),
        franjaHorarioService.list({
          carreraPeriodoId: Number(selectedCP),
          includeInactive: false,
          page: 1,
          limit: 500,
        }),
        casosEstudioService.list({ includeInactive: false }),
      ]);

      setEstudiantes(est ?? []);
      setFranjas(fr ?? []);
      setCasos(cs ?? []);
    } catch {
      setEstudiantes([]);
      setFranjas([]);
      setCasos([]);
      showToast("No se pudieron cargar estudiantes/franjas/casos.", "error");
    }
  }

  async function openCreateModal() {
    if (!selectedCP) return showToast("Seleccione Carrera–Período.", "error");

    resetTribunalForm();
    setEditing(null);

    // ✅ por defecto: Plantilla
    setModoIndividual(false);
    setIndividualForm({ id_estudiante: "", id_franja_horario: "", id_caso_estudio: "" });

    // ✅ listas listas (si cambias a Individual)
    await loadListasParaCrear();

    setShowFormModal(true);
  }

  async function openEditModal(t: any) {
    try {
      setLoading(true);
      setEditing(t);
      setFormErrors({});

      const full = await tribunalesService.get(Number(t.id_tribunal));
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

      // edit no usa modo individual
      setModoIndividual(false);
      setIndividualForm({ id_estudiante: "", id_franja_horario: "", id_caso_estudio: "" });

      setShowFormModal(true);
    } catch {
      showToast("No se pudo cargar el tribunal para editar.", "error");
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

  function validateIndividual(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!individualForm.id_estudiante) e.id_estudiante = "Seleccione estudiante.";
    if (!individualForm.id_caso_estudio) e.id_caso_estudio = "Seleccione caso de estudio.";
    if (!individualForm.id_franja_horario) e.id_franja_horario = "Seleccione franja horaria.";
    return e;
  }

  function extractIdTrib(created: any): number {
    // soporta varias formas
    const candidates = [
      created?.id_tribunal,
      created?.data?.id_tribunal,
      created?.data?.data?.id_tribunal,
      created?.result?.id_tribunal,
      created?.data?.result?.id_tribunal,
    ].map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n) && n > 0);

    return candidates[0] || 0;
  }

  async function onSaveTribunal() {
    // 1) valida docentes/nombre
    const e = validateTribunalForm();

    // 2) valida individual solo si CREATE + modoIndividual
    if (!editing && modoIndividual) {
      Object.assign(e, validateIndividual());
    }

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

        // ✅ 1) crear tribunal
        const created = await tribunalesService.create(payload);
        const idTrib = extractIdTrib(created);

        // ✅ 2) si es Individual: crear asignación inmediata (obligatoria)
        if (modoIndividual) {
          if (!idTrib) throw new Error("No se obtuvo id_tribunal al crear.");

          const asigPayload: TribunalEstudianteCreateDTO = {
            id_tribunal: idTrib,
            id_estudiante: Number(individualForm.id_estudiante),
            id_franja_horario: Number(individualForm.id_franja_horario),
            id_caso_estudio: Number(individualForm.id_caso_estudio),
          };

          await tribunalEstudiantesService.create(asigPayload);
          showToast("Tribunal individual creado (con asignación).", "success");
        } else {
          showToast("Plantilla creada. Ahora puedes asignar estudiantes.", "success");
        }
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
      const msg =
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        err?.userMessage ||
        "No se pudo guardar el tribunal.";
      showToast(String(msg), "error");
    } finally {
      setSavingTribunal(false);
    }
  }

  // ===== ASIGNACIONES (desde PLANTILLAS) =====
  async function openAsignaciones(t: any) {
    const idTrib = Number(t?.id_tribunal);
    const tribunalBase = tribunales.find((x: any) => Number(x.id_tribunal) === idTrib) ?? (t as any);

    setActiveTribunalForAsign(tribunalBase as any);
    setAsignForm({ id_estudiante: "", id_franja_horario: "", id_caso_estudio: "" });
    setErrors({});
    setAsignaciones([]);

    try {
      setLoading(true);

      const [a, est, fr, cs] = await Promise.all([
        tribunalEstudiantesService.list({
          tribunalId: idTrib,
          includeInactive: true,
          page: 1,
          limit: 300,
        }),
        estudiantesService.list({
          carreraPeriodoId: Number((tribunalBase as any).id_carrera_periodo),
          includeInactive: false,
          page: 1,
          limit: 500,
        }),
        franjaHorarioService.list({
          carreraPeriodoId: Number((tribunalBase as any).id_carrera_periodo),
          includeInactive: false,
          page: 1,
          limit: 500,
        }),
        casosEstudioService.list({ includeInactive: false }),
      ]);

      setAsignaciones(a ?? []);
      setEstudiantes(est ?? []);
      setFranjas(fr ?? []);
      setCasos(cs ?? []);

      setShowAsignModal(true);
    } catch {
      showToast("No se pudo cargar datos para asignación.", "error");
      setShowAsignModal(false);
    } finally {
      setLoading(false);
    }
  }

  function validateAsignacionForm(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!asignForm.id_estudiante) e.id_estudiante = "Seleccione estudiante.";
    if (!asignForm.id_franja_horario) e.id_franja_horario = "Seleccione franja horaria.";
    if (!asignForm.id_caso_estudio) e.id_caso_estudio = "Seleccione caso de estudio.";
    return e;
  }

  async function onCreateAsignacion() {
    if (!activeTribunalForAsign) return;

    const e = validateAsignacionForm();
    setErrors(e);
    if (Object.keys(e).length) {
      showToast("Revisa la asignación.", "error");
      return;
    }

    try {
      setLoading(true);

      const payload: TribunalEstudianteCreateDTO = {
        id_tribunal: Number((activeTribunalForAsign as any).id_tribunal),
        id_estudiante: Number(asignForm.id_estudiante),
        id_franja_horario: Number(asignForm.id_franja_horario),
        id_caso_estudio: Number(asignForm.id_caso_estudio),
      };

      await tribunalEstudiantesService.create(payload);

      // recargar asignaciones del modal
      const a = await tribunalEstudiantesService.list({
        tribunalId: Number((activeTribunalForAsign as any).id_tribunal),
        includeInactive: true,
        page: 1,
        limit: 300,
      });
      setAsignaciones(a ?? []);
      setAsignForm({ id_estudiante: "", id_franja_horario: "", id_caso_estudio: "" });
      setErrors({});

      showToast("Asignación creada.", "success");

      // ✅ refresca la tabla general => la plantilla “se mueve” a individuales
      await loadAll();
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

      const id = Number((row as any).id_tribunal_estudiante);
      const current: Estado01 = normalizeEstado01((row as any).estado ?? 1);
      await tribunalEstudiantesService.toggleEstado(id, current);

      if (activeTribunalForAsign) {
        const a = await tribunalEstudiantesService.list({
          tribunalId: Number((activeTribunalForAsign as any).id_tribunal),
          includeInactive: true,
          page: 1,
          limit: 300,
        });
        setAsignaciones(a ?? []);
      }

      showToast("Estado de asignación actualizado.", "success");
      await loadAll();
    } catch {
      showToast("No se pudo cambiar el estado de la asignación.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function onToggleEstadoTribunal(t: any) {
    try {
      setLoading(true);
      const current = normalizeEstado01(t.estado ?? t.estado_activo);
      await tribunalesService.toggleEstado(Number(t.id_tribunal), current as 0 | 1);
      showToast(current === 1 ? "Tribunal desactivado." : "Tribunal activado.", "success");
      await loadAll();
    } catch {
      showToast("No se pudo cambiar el estado.", "error");
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
      const msg = err?.response?.data?.message || err?.userMessage || "No se pudo guardar calificadores generales.";
      showToast(String(msg), "error");
    } finally {
      setSavingCG(false);
    }
  }

  return (
    <div className="tribunalesPage">
      {toast ? <div className={`toast toast-${toast.type}`}>{toast.msg}</div> : null}

      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h2 className="heroTitle">GESTIÓN DE TRIBUNALES</h2>
              <p className="heroSubtitle">{selectedCPLabel || "Seleccione Carrera–Período"}</p>
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn primary" onClick={openCreateModal} disabled={!selectedCP}>
              <Plus className="heroBtnIcon" /> Añadir Tribunal
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
                Plan de Evaluación Activo
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
                  Plan de Evaluación para <b>{plan?.nombre_carrera ?? selectedCPLabel ?? "Carrera–Período"}</b>
                </p>

                {Array.isArray(plan?.detalles) && plan.detalles.length ? (
                  <div className="planList">
                    {plan.detalles.map((d: any, idx: number) => (
                      <div className="planItem" key={idx}>
                        <div className="planItemLeft">
                          <div className="planItemTitle">{d?.nombre ?? d?.titulo ?? "Ítem"}</div>
                          <div className="planItemSub">{d?.tipo ?? d?.descripcion ?? ""}</div>
                        </div>
                        <div className="planItemRight">
                          <span className="planPercent">{Number(d?.porcentaje ?? d?.ponderacion ?? 0).toFixed(2)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="muted">
                      Plan activo: <b>{plan.nombre_plan ?? "Plan de evaluación"}</b>
                    </p>
                    {plan.descripcion_plan ? <p className="muted">{plan.descripcion_plan}</p> : null}
                  </>
                )}

                <button className="btnGhost" onClick={() => navigate(`/plan-evaluacion?cp=${selectedCP}`)} disabled={!selectedCP}>
                  Gestionar
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

        {/* ========= INDIVIDUALES ========= */}
        <div className="box" style={{ marginTop: 14 }}>
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <Users size={18} />
              </span>
              Listado de Tribunales
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

          {/* SUMMARY + ORDEN */}
          <div className="summaryRow">
            <div className="summaryBoxes">
              <div className="summaryBox">
                <span className="summaryLabel">Total</span>
                <span className="summaryValue">{total}</span>
              </div>

              <div className="summaryBox active">
                <span className="summaryLabel">Individuales</span>
                <span className="summaryValue">{totalInd}</span>
              </div>

              <div className="summaryBox inactive">
                <span className="summaryLabel">Plantillas</span>
                <span className="summaryValue">{totalTpl}</span>
              </div>
            </div>

            <div className="orderHint">
              <ArrowUpAZ size={16} /> Ordenado por: <b>Id (A-Z)</b>
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
                placeholder="Buscar por estudiante o fecha..."
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

          {/* TABLE INDIVIDUALES (estilo captura 2) */}
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="thCenter">
                    <span className="thFlex">
                      <Gavel size={16} /> Tribunal
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <FileSpreadsheet size={16} /> Caso
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <Users size={16} /> Estudiante
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <CalendarPlus size={16} /> Fecha
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <CalendarPlus size={16} /> Horario
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <FlaskConical size={16} /> Lab.
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <Users size={16} /> Miembros del Tribunal
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <BadgeCheck size={16} /> Estado
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <Pencil size={16} /> Acciones
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {!selectedCP ? (
                  <tr>
                    <td colSpan={9} className="emptyCell">
                      <div className="empty">Seleccione una Carrera–Período para ver tribunales.</div>
                    </td>
                  </tr>
                ) : loading || loadingVM ? (
                  <tr>
                    <td colSpan={9} className="emptyCell">
                      <div className="empty">Cargando...</div>
                    </td>
                  </tr>
                ) : paginatedInd.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="emptyCell">
                      <div className="empty">No hay tribunales individuales para mostrar.</div>
                    </td>
                  </tr>
                ) : (
                  paginatedInd.map((t) => {
                    const activoTrib = t.estado_activo === 1;

                    // estado “Abierto/Cerrado”
                    let estadoTxt = "Sin asignaciones";
                    let estadoClass = "estadoPill estadoNeutral";
                    let estadoIcon = <BadgeX size={16} />;

                    if (t.cerrado === true) {
                      estadoTxt = "Cerrado";
                      estadoClass = "estadoPill estadoCerrado";
                      estadoIcon = <BadgeX size={16} />;
                    } else if (t.cerrado === false) {
                      estadoTxt = "Abierto";
                      estadoClass = "estadoPill estadoAbierto";
                      estadoIcon = <BadgeCheck size={16} />;
                    }

                    return (
                      <tr key={t.id_tribunal}>
                        <td className="tdCenter">
                          <span className="chipPill chipBlue">{t.nombre_tribunal}</span>
                        </td>

                        <td className="tdCenter">
                          {t.caso && t.caso !== "-" ? <span className="chipPill chipGreen">{t.caso}</span> : "-"}
                        </td>

                        <td className="tdCenter">
                          <div style={{ fontWeight: 900 }}>{t.estudiante}</div>
                          <div className="muted" style={{ marginTop: 2 }}>{t.institucional}</div>
                        </td>

                        <td className="tdCenter">{t.fecha}</td>
                        <td className="tdCenter">{t.horario}</td>

                        <td className="tdCenter">
                          {t.lab && t.lab !== "-" ? <span className="chipPill chipGray">{t.lab}</span> : "-"}
                        </td>

                        <td className="tdCenter tdMiembros">
                          <div className="miembrosWrap">
                            {t.miembros?.length ? (
                              t.miembros.map((m, idx) => (
                                <span key={idx} className="chipPill chipGreen" title={m.label}>
                                  {m.label}
                                </span>
                              ))
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </div>
                        </td>

                        <td className="tdCenter">
                          <span className={estadoClass}>
                            {estadoIcon} {estadoTxt}
                          </span>
                          {!activoTrib && <div className="muted" style={{ marginTop: 6 }}>Inactivo</div>}
                        </td>

                        <td className="tdActions">
                          <div className="actions">
                            <button className="iconBtn iconBtn_neutral" onClick={() => openView(t as any)} type="button">
                              <Eye className="iconAction" />
                              <span className="tooltip">Ver</span>
                            </button>

                            <button className="iconBtn iconBtn_purple" onClick={() => openEditModal(t as any)} type="button">
                              <Pencil className="iconAction" />
                              <span className="tooltip">Editar</span>
                            </button>

                            <button className="iconBtn iconBtn_primary" onClick={() => onToggleEstadoTribunal(t as any)} type="button">
                              {activoTrib ? <ToggleRight className="iconAction" /> : <ToggleLeft className="iconAction" />}
                              <span className="tooltip">{activoTrib ? "Desactivar" : "Activar"}</span>
                            </button>

                            {/* En individuales no necesitas “Asignar”, pero si quieres ver asignaciones, lo dejamos */}
                            <button className="iconBtn iconBtn_neutral" onClick={() => openAsignaciones(t as any)} type="button">
                              <CalendarPlus className="iconAction" />
                              <span className="tooltip">Asignaciones</span>
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

          {/* PAGINATION IND */}
          <div className="paginationRow">
            <button className="btnGhost" disabled={currentPageInd <= 1} onClick={() => setPageInd((p) => Math.max(1, p - 1))}>
              ← Anterior
            </button>

            <span className="paginationText">
              Página {currentPageInd} de {totalPagesInd}
            </span>

            <button
              className="btnGhost"
              disabled={currentPageInd >= totalPagesInd}
              onClick={() => setPageInd((p) => Math.min(totalPagesInd, p + 1))}
            >
              Siguiente →
            </button>
          </div>
        </div>

        {/* ========= PLANTILLAS ========= */}
        <div className="box" style={{ marginTop: 14 }}>
          <div className="boxHead" style={{ justifyContent: "space-between" }}>
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <Users size={18} />
              </span>
              Plantillas de Tribunal <span className="muted" style={{ marginLeft: 8 }}>Configuraciones base para generar múltiples tribunales</span>
            </div>

            <div className="boxRight">
              {/* (opcional) botón importar Excel (luego lo conectamos) */}
              <button className="btnGhost" type="button" disabled title="Próximamente">
                <FileSpreadsheet size={16} style={{ marginRight: 8 }} />
                Importar desde Excel
              </button>
            </div>
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Descripción</th>
                  <th>Fecha Base</th>
                  <th>Horario Base</th>
                  <th>Miembros del Tribunal</th>
                  <th style={{ width: 140 }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!selectedCP ? (
                  <tr>
                    <td colSpan={6} className="emptyCell">
                      <div className="empty">Seleccione una Carrera–Período para ver plantillas.</div>
                    </td>
                  </tr>
                ) : loading || loadingVM ? (
                  <tr>
                    <td colSpan={6} className="emptyCell">
                      <div className="empty">Cargando...</div>
                    </td>
                  </tr>
                ) : paginatedTpl.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="emptyCell">
                      <div className="empty">No hay plantillas para mostrar.</div>
                    </td>
                  </tr>
                ) : (
                  paginatedTpl.map((t, idx) => {
                    const activoTrib = t.estado_activo === 1;
                    const numero = (currentPageTpl - 1) * PAGE_SIZE + idx + 1;

                    return (
                      <tr key={t.id_tribunal}>
                        <td className="tdCenter">{numero}</td>

                        <td>
                          <div style={{ fontWeight: 900 }}>{t.nombre_tribunal}</div>
                          <div className="muted" style={{ marginTop: 2 }}>
                            Plantilla de tribunal
                          </div>
                        </td>

                        {/* No hay base real aún (porque no hay asignaciones) */}
                        <td className="tdCenter">-</td>
                        <td className="tdCenter">-</td>

                        <td className="tdCenter tdMiembros">
                          <div className="miembrosWrap">
                            {t.miembros?.length ? (
                              t.miembros.map((m, i) => (
                                <span key={i} className="chipPill chipGreen" title={m.label}>
                                  {m.label}
                                </span>
                              ))
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </div>
                        </td>

                        <td className="tdActions">
                          <div className="actions">
                            {/* Asignar (aquí sí es clave) */}
                            <button className="iconBtn iconBtn_neutral" onClick={() => openAsignaciones(t as any)} type="button">
                              <CalendarPlus className="iconAction" />
                              <span className="tooltip">Asignar</span>
                            </button>

                            <button className="iconBtn iconBtn_purple" onClick={() => openEditModal(t as any)} type="button">
                              <Pencil className="iconAction" />
                              <span className="tooltip">Editar</span>
                            </button>

                            <button className="iconBtn iconBtn_primary" onClick={() => onToggleEstadoTribunal(t as any)} type="button">
                              {activoTrib ? <ToggleRight className="iconAction" /> : <ToggleLeft className="iconAction" />}
                              <span className="tooltip">{activoTrib ? "Desactivar" : "Activar"}</span>
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

          {/* PAGINATION TPL */}
          <div className="paginationRow">
            <button className="btnGhost" disabled={currentPageTpl <= 1} onClick={() => setPageTpl((p) => Math.max(1, p - 1))}>
              ← Anterior
            </button>

            <span className="paginationText">
              Página {currentPageTpl} de {totalPagesTpl}
            </span>

            <button
              className="btnGhost"
              disabled={currentPageTpl >= totalPagesTpl}
              onClick={() => setPageTpl((p) => Math.min(totalPagesTpl, p + 1))}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {/* MODAL FORM (plantilla / individual en CREATE) */}
      <TribunalFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        editing={editing}
        docentes={docentes}
        selectedCPLabel={selectedCPLabel || ""}
        tribunalForm={tribunalForm}
        setTribunalForm={setTribunalForm}
        modoIndividual={modoIndividual}
        setModoIndividual={setModoIndividual}
        individualForm={individualForm}
        setIndividualForm={setIndividualForm}
        estudiantes={estudiantes}
        franjas={franjas}
        casos={casos}
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
        isActivo={isActivo}
      />
    </div>
  );
}
