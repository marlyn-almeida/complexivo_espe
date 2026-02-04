// src/pages/periodos/PeriodoCarrerasPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  RefreshCw,
  Filter,
  X,
  Save,
  Clock,
} from "lucide-react";

import "./PeriodoCarrerasPage.css";

import { periodosService } from "../../services/periodos.service";
import { carrerasService } from "../../services/carreras.service";
import { departamentosService } from "../../services/departamentos.service";

import {
  carreraPeriodoService,
  type CarreraPeriodoAdminsUpdateDTO,
  type CarreraPeriodoAdminsResponse,
} from "../../services/carreraPeriodo.service";

import type { PeriodoAcademico } from "../../types/periodoAcademico";
import type { Carrera } from "../../types/carrera";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { Departamento } from "../../types/departamento";

const toYMD = (v: any) => (v ? String(v).slice(0, 10) : "");
const isActive = (estado?: boolean | number | null) => estado === true || Number(estado) === 1;

function carreraMeta(x: any) {
  return [x.codigo_carrera, x.modalidad, x.sede].filter(Boolean).join(" · ");
}

function formatAdminLite(a?: any | null) {
  if (!a) return "— Sin asignar —";
  const full = `${a.apellidos_docente ?? ""} ${a.nombres_docente ?? ""}`.trim();
  const user = a.nombre_usuario ? ` (${a.nombre_usuario})` : "";
  return (full || "—") + user;
}

type ToastType = "success" | "error" | "info";

function getCarreraDeptId(c: any): number | null {
  const v =
    c?.id_departamento ??
    c?.departamento_id ??
    c?.idDept ??
    c?.departamento?.id_departamento ??
    c?.departamento?.id ??
    null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getDocenteDeptId(d: any): number | null {
  const v =
    d?.id_departamento ??
    d?.departamento_id ??
    d?.idDept ??
    d?.departamento?.id_departamento ??
    d?.departamento?.id ??
    null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function PeriodoCarrerasPage() {
  // ✅ soporta /periodos/:id/carreras y /carrera-periodo?periodoId=
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const periodoId = Number(searchParams.get("periodoId")) || Number(id) || 0;

  const nav = useNavigate();

  // base
  const [loading, setLoading] = useState<boolean>(true);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  const [periodo, setPeriodo] = useState<PeriodoAcademico | null>(null);

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [items, setItems] = useState<CarreraPeriodo[]>([]);

  // filtros
  const [q, setQ] = useState<string>("");
  const [deptId, setDeptId] = useState<string>("");

  const [loadAdminsInCards, setLoadAdminsInCards] = useState<boolean>(false);

  // debounce search
  const [qDebounced, setQDebounced] = useState<string>("");
  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  // Modal ASIGNAR + autoridades
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assignSaving, setAssignSaving] = useState<boolean>(false);

  const [selectedCarreraId, setSelectedCarreraId] = useState<string>("");
  const hasCarreraSelected = selectedCarreraId !== "";

  const [showAllDocentes, setShowAllDocentes] = useState<boolean>(false);
  const [dirIdNew, setDirIdNew] = useState<string>("");
  const [apoIdNew, setApoIdNew] = useState<string>("");

  // Modal Autoridades (desde card)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authSaving, setAuthSaving] = useState<boolean>(false);

  const [selectedCP, setSelectedCP] = useState<CarreraPeriodo | null>(null);
  const [admins, setAdmins] = useState<CarreraPeriodoAdminsResponse | null>(null);

  const [dirId, setDirId] = useState<string>("");
  const [apoId, setApoId] = useState<string>("");

  const [docentes, setDocentes] = useState<any[]>([]);
  const [loadingDocentes, setLoadingDocentes] = useState<boolean>(false);

  const mountedRef = useRef<boolean>(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // =========================
  // Fetch base
  // =========================
  async function loadPeriodo() {
    const all = await periodosService.list({ includeInactive: true });
    const p = (all || []).find((x: any) => Number(x.id_periodo) === periodoId) || null;
    if (!mountedRef.current) return;
    setPeriodo(p);
  }

  async function loadCarreras() {
    const cs = await carrerasService.list();
    if (!mountedRef.current) return;
    setCarreras(cs ?? []);
  }

  async function loadDepartamentos() {
    try {
      const ds = await departamentosService.list();
      if (!mountedRef.current) return;
      setDepartamentos(ds ?? []);
    } catch {
      if (!mountedRef.current) return;
      setDepartamentos([]);
    }
  }

  async function enrichAdmins(list: CarreraPeriodo[]) {
    const CONCURRENCY = 8;
    const out = [...list] as any[];
    let idx = 0;

    async function worker() {
      while (idx < out.length) {
        const i = idx++;
        const cp = out[i];
        if (!cp?.id_carrera_periodo) continue;
        try {
          const a = await carreraPeriodoService.getAdmins(cp.id_carrera_periodo);
          cp.director = a.director ?? null;
          cp.apoyo = a.apoyo ?? null;
        } catch {
          cp.director = cp.director ?? null;
          cp.apoyo = cp.apoyo ?? null;
        }
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, out.length) }, () => worker());
    await Promise.all(workers);
    return out as CarreraPeriodo[];
  }

  async function loadItems(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);

    try {
      const data = await carreraPeriodoService.listByPeriodo(periodoId, {
        includeInactive: false,
        q: qDebounced.trim() || undefined,
      });

      let list = (data ?? []) as any[];

      // ✅ si el backend aún devuelve inactivas por error, filtramos aquí
      list = list.filter((x: any) => isActive(x.estado));

      if (loadAdminsInCards && list.length) {
        list = (await enrichAdmins(list)) as any[];
      }

      if (!mountedRef.current) return;
      setItems(list ?? []);
    } catch (e: any) {
      const first = e?.data?.errors?.[0]?.msg || e?.userMessage || "No se pudo cargar carreras del período.";
      showToast(first, "error");
      if (!mountedRef.current) return;
      setItems([]);
    } finally {
      if (!opts?.silent && mountedRef.current) setLoading(false);
    }
  }

  async function initialLoad() {
    if (!Number.isFinite(periodoId) || periodoId <= 0) {
      showToast("ID de período inválido", "error");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await Promise.all([loadPeriodo(), loadCarreras(), loadDepartamentos()]);
      await loadItems({ silent: true });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoId]);

  useEffect(() => {
    if (!Number.isFinite(periodoId) || periodoId <= 0) return;
    if (loading) return;
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, loadAdminsInCards]);

  // =========================
  // Helpers UI
  // =========================
  const title = periodo?.codigo_periodo || `Período #${periodoId}`;
  const subtitle = periodo?.descripcion_periodo || "";
  const rango =
    periodo?.fecha_inicio && periodo?.fecha_fin
      ? `${toYMD(periodo.fecha_inicio)} → ${toYMD(periodo.fecha_fin)}`
      : "";

  const carreraById = useMemo(() => {
    const m = new Map<number, Carrera>();
    (carreras ?? []).forEach((c: any) => m.set(Number(c.id_carrera), c));
    return m;
  }, [carreras]);

  const assignedMap = useMemo(() => {
    const m = new Map<number, CarreraPeriodo>();
    items.forEach((x: any) => m.set(Number((x as any).id_carrera), x));
    return m;
  }, [items]);

  const hasDeptSelected = deptId !== "";

  const itemsFiltered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const dept = hasDeptSelected ? Number(deptId) : null;

    return (items ?? []).filter((x: any) => {
      if (dept) {
        const c = carreraById.get(Number(x.id_carrera));
        const cDept = getCarreraDeptId(c);
        if (cDept !== dept) return false;
      }

      if (!term) return true;
      const a = String(x.nombre_carrera || "").toLowerCase();
      const b = String(x.codigo_carrera || "").toLowerCase();
      const c = String(x.modalidad || "").toLowerCase();
      const d = String(x.sede || "").toLowerCase();
      return a.includes(term) || b.includes(term) || c.includes(term) || d.includes(term);
    });
  }, [items, q, deptId, carreraById, hasDeptSelected]);

  const carrerasDisponibles = useMemo(() => {
    const arr = [...(carreras ?? [])].filter((c: any) => !assignedMap.has(Number(c.id_carrera)));
    arr.sort((a: any, b: any) =>
      String(a.nombre_carrera || "").localeCompare(String(b.nombre_carrera || ""))
    );
    return arr;
  }, [carreras, assignedMap]);

  async function ensureDocentesLoaded() {
    if (docentes.length) return;

    setLoadingDocentes(true);
    try {
      const mod = await import("../../services/docentes.service");
      const list = await mod.docentesService.list(false);
      if (!mountedRef.current) return;
      setDocentes((list || []).filter((d: any) => Number(d.estado) === 1));
    } catch {
      if (!mountedRef.current) return;
      setDocentes([]);
      showToast("No se pudieron cargar docentes.", "error");
    } finally {
      if (mountedRef.current) setLoadingDocentes(false);
    }
  }

  const docentesFiltrados = useMemo(() => {
    const idCarr = Number(selectedCarreraId);
    if (!idCarr) return docentes;

    if (showAllDocentes) return docentes;

    const car = carreraById.get(idCarr);
    const deptCarr = getCarreraDeptId(car);
    if (!deptCarr) return docentes;

    return (docentes ?? []).filter((d: any) => getDocenteDeptId(d) === deptCarr);
  }, [docentes, showAllDocentes, selectedCarreraId, carreraById]);

  // =========================
  // MODAL ASIGNAR + autoridades
  // =========================
  async function openAssign() {
    setSelectedCarreraId("");
    setDirIdNew("");
    setApoIdNew("");
    setShowAllDocentes(false);

    setShowAssignModal(true);
    await ensureDocentesLoaded();
  }

  function closeAssign() {
    setShowAssignModal(false);
    setSelectedCarreraId("");
    setDirIdNew("");
    setApoIdNew("");
    setShowAllDocentes(false);
  }

  async function onSaveAssignWithAdmins() {
    const idCarrera = Number(selectedCarreraId);
    if (!idCarrera) return showToast("Selecciona una carrera.", "error");
    if (!dirIdNew) return showToast("Selecciona un Director.", "error");
    if (!apoIdNew) return showToast("Selecciona un Docente de Apoyo.", "error");
    if (dirIdNew === apoIdNew) return showToast("Director y Apoyo no pueden ser el mismo docente.", "error");

    setAssignSaving(true);
    try {
      const bulkRes = await carreraPeriodoService.bulkAssign({
        id_periodo: periodoId,
        carreraIds: [idCarrera],
      });

      const createdCP =
        (bulkRes?.items || []).find((x: any) => Number(x.id_carrera) === idCarrera) ?? null;

      const idCarreraPeriodo = Number((createdCP as any)?.id_carrera_periodo || 0);
      if (!idCarreraPeriodo) {
        showToast(
          "Se asignó la carrera, pero el backend no devolvió el id_carrera_periodo para guardar autoridades.",
          "error"
        );
        await loadItems({ silent: true });
        closeAssign();
        return;
      }

      await carreraPeriodoService.setAdmins(idCarreraPeriodo, {
        id_docente_director: Number(dirIdNew),
        id_docente_apoyo: Number(apoIdNew),
      });

      showToast("Carrera y autoridades guardadas.", "success");
      closeAssign();
      await loadItems({ silent: true });
    } catch (e: any) {
      const first = e?.data?.errors?.[0]?.msg || e?.userMessage || "No se pudo guardar.";
      showToast(first, "error");
    } finally {
      setAssignSaving(false);
    }
  }

  // =========================
  // MODAL AUTORIDADES (desde card)
  // =========================
  async function openAutoridadesModal(cp: CarreraPeriodo) {
    setSelectedCP(cp);
    setShowAuthModal(true);
    setAuthLoading(true);
    setAdmins(null);
    setDirId("");
    setApoId("");

    try {
      await ensureDocentesLoaded();

      const data = await carreraPeriodoService.getAdmins((cp as any).id_carrera_periodo);
      if (!mountedRef.current) return;

      setAdmins(data);
      setDirId(data.director?.id_docente ? String(data.director.id_docente) : "");
      setApoId(data.apoyo?.id_docente ? String(data.apoyo.id_docente) : "");
    } catch (err: any) {
      const first = err?.data?.errors?.[0]?.msg || err?.userMessage || "No se pudo cargar autoridades";
      showToast(first, "error");
      if (!mountedRef.current) return;
      setAdmins(null);
      setDirId("");
      setApoId("");
    } finally {
      if (mountedRef.current) setAuthLoading(false);
    }
  }

  function closeAutoridadesModal() {
    setShowAuthModal(false);
    setSelectedCP(null);
    setAdmins(null);
    setDirId("");
    setApoId("");
  }

  async function onSaveAutoridades() {
    if (!selectedCP) return;

    if (dirId && apoId && dirId === apoId) {
      showToast("Director y Apoyo no pueden ser el mismo docente.", "error");
      return;
    }

    setAuthSaving(true);
    try {
      const payload: CarreraPeriodoAdminsUpdateDTO = {
        id_docente_director: dirId ? Number(dirId) : null,
        id_docente_apoyo: apoId ? Number(apoId) : null,
      };

      await carreraPeriodoService.setAdmins((selectedCP as any).id_carrera_periodo, payload);

      if (!mountedRef.current) return;

      showToast("Autoridades guardadas.", "success");
      closeAutoridadesModal();

      await loadItems({ silent: true });
    } catch (err: any) {
      const first = err?.data?.errors?.[0]?.msg || err?.userMessage || "No se pudo guardar autoridades";
      showToast(first, "error");
    } finally {
      if (mountedRef.current) setAuthSaving(false);
    }
  }

  // =========================
  // FRANJAS HORARIAS (NUEVO)
  // =========================
  function goFranjas(cp: CarreraPeriodo) {
    const idCP = Number((cp as any).id_carrera_periodo || 0);
    if (!idCP) return showToast("No existe id_carrera_periodo", "error");

    const nombreCarrera = encodeURIComponent(String((cp as any).nombre_carrera || ""));

    // ✅ CAMBIO: tu ruta real en AppRoutes es "/franjas"
    nav(`/franjas?carreraPeriodoId=${idCP}&periodoId=${periodoId}&carrera=${nombreCarrera}`);
  }

  // =========================
  // Render
  // =========================
  return (
    <div className="wrap">
      <div className="containerFull">
        <div className="pcpPage">
          {/* HERO */}
          <div className="hero">
            <div className="heroLeft">
              <button className="heroBtn ghost" onClick={() => nav("/periodos")} type="button" title="Volver">
                <ArrowLeft className="heroBtnIcon" /> Volver
              </button>

              <div className="heroText">
                <h1 className="heroTitle">{title}</h1>
                <div className="heroSubtitle">{subtitle}</div>
                {rango ? <div className="heroSubtitle">{rango}</div> : null}
              </div>
            </div>

            <div className="heroActions">
              <button className="heroBtn primary" onClick={openAssign} disabled={loading} type="button">
                <Plus className="heroBtnIcon" /> Asignar carrera
              </button>
            </div>
          </div>

          {/* BOX */}
          <div className="box">
            <div className="boxHead">
              <div className="sectionTitle">
                <span className="sectionTitleIcon">
                  <Users size={18} />
                </span>
                Carreras del período <span className="pcpCount">{itemsFiltered.length}</span>
              </div>

              <div className="boxRight">
                {/* SEARCH */}
                <div className="searchWrap">
                  <Search className="searchIcon" />
                  <input
                    className="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar carrera…"
                  />
                </div>

                {/* FILTER DEPARTAMENTO */}
                <div className="filterWrap" title="Filtrar por departamento">
                  <Filter className="filterIcon" />
                  <select className="select" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                    <option value="">Todos los departamentos</option>
                    {departamentos.map((d: any) => (
                      <option key={d.id_departamento} value={String(d.id_departamento)}>
                        {d.nombre_departamento}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TOGGLE: ver autoridades */}
                <label className="toggle" title="Mostrar Director/Apoyo en cada card (puede demorar)">
                  <input
                    type="checkbox"
                    checked={loadAdminsInCards}
                    onChange={(e) => setLoadAdminsInCards(e.target.checked)}
                  />
                  <span className="slider" />
                  <span className="toggleText">Ver autoridades</span>
                </label>

                {/* REFRESH */}
                <button className="iconBtn iconBtn_primary" onClick={() => loadItems()} disabled={loading} type="button">
                  <RefreshCw className="iconAction" />
                  <span className="tooltip">Actualizar</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="empty">Cargando…</div>
            ) : itemsFiltered.length === 0 ? (
              <div className="empty">No hay carreras asignadas.</div>
            ) : (
              <div className="pcpCards">
                {itemsFiltered.map((x: any) => {
                  const activo = isActive(x.estado);

                  return (
                    <div className="pcpCard" key={x.id_carrera_periodo}>
                      <div className="pcpCardLeft">
                        <div className="pcpTitleRow">
                          <div className="pcpCardTitle">{x.nombre_carrera || "—"}</div>
                          <span className="pcpBadgeActive">{activo ? "ACTIVO" : "INACTIVO"}</span>
                        </div>

                        <div className="pcpCardMeta">{carreraMeta(x) || "—"}</div>

                        {loadAdminsInCards ? (
                          <div className="pcpAdmins">
                            <div className="pcpAdminRow">
                              <span className="pcpAdminK">Director:</span>
                              <span className="pcpAdminV">{formatAdminLite((x as any).director)}</span>
                            </div>
                            <div className="pcpAdminRow">
                              <span className="pcpAdminK">Docente Apoyo:</span>
                              <span className="pcpAdminV">{formatAdminLite((x as any).apoyo)}</span>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="pcpCardRight">
                        <button
                          className="pcpBtn pcpBtnSoft"
                          onClick={() => openAutoridadesModal(x)}
                          disabled={!activo}
                          type="button"
                        >
                          <Users size={16} /> Autoridades
                        </button>

                        <button
                          className="pcpBtn pcpBtnGhost"
                          onClick={() => goFranjas(x)}
                          disabled={!activo}
                          type="button"
                        >
                          <Clock size={16} /> Franjas
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MODAL ASIGNAR + autoridades */}
          {showAssignModal && (
            <div className="pcpOverlay" onClick={closeAssign}>
              <div className="pcpModal" onClick={(e) => e.stopPropagation()}>
                <div className="pcpModalHeader">
                  <div className="pcpModalHeaderLeft">
                    <div className="pcpModalIcon">
                      <Plus size={18} />
                    </div>
                    <div className="pcpModalHeaderText">
                      <div className="pcpModalTitle">Asignar carrera + autoridades</div>
                      <div className="pcpModalSub">{title}</div>
                    </div>
                  </div>
                  <button className="pcpModalClose" onClick={closeAssign} aria-label="Cerrar" type="button">
                    <X size={18} />
                  </button>
                </div>

                <div className="pcpModalBody">
                  <div className="pcpField">
                    <label>Carrera</label>
                    <select
                      value={selectedCarreraId}
                      onChange={(e) => {
                        setSelectedCarreraId(e.target.value);
                        setDirIdNew("");
                        setApoIdNew("");
                        setShowAllDocentes(false);
                      }}
                      disabled={assignSaving}
                    >
                      <option value="">(Selecciona una carrera)</option>
                      {carrerasDisponibles.map((c: any) => (
                        <option key={c.id_carrera} value={String(c.id_carrera)}>
                          {c.nombre_carrera} — {carreraMeta(c)}
                        </option>
                      ))}
                    </select>
                    <div className="pcpHint">Solo aparecen carreras que aún no están asignadas al período.</div>
                  </div>

                  <label className="toggle" title="Por defecto se muestran docentes del departamento de la carrera">
                    <input
                      type="checkbox"
                      checked={showAllDocentes}
                      onChange={(e) => setShowAllDocentes(e.target.checked)}
                      disabled={assignSaving || loadingDocentes || !hasCarreraSelected}
                    />
                    <span className="slider" />
                    <span className="toggleText">Mostrar docentes de todos los departamentos</span>
                  </label>

                  <div className="pcpField">
                    <label>Director</label>
                    <select
                      value={dirIdNew}
                      onChange={(e) => setDirIdNew(e.target.value)}
                      disabled={assignSaving || loadingDocentes || !hasCarreraSelected}
                    >
                      <option value="">(Selecciona Director)</option>
                      {docentesFiltrados.map((d: any) => (
                        <option key={d.id_docente} value={String(d.id_docente)}>
                          {d.apellidos_docente} {d.nombres_docente} — {d.nombre_usuario}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pcpField">
                    <label>Docente de apoyo</label>
                    <select
                      value={apoIdNew}
                      onChange={(e) => setApoIdNew(e.target.value)}
                      disabled={assignSaving || loadingDocentes || !hasCarreraSelected}
                    >
                      <option value="">(Selecciona Apoyo)</option>
                      {docentesFiltrados.map((d: any) => (
                        <option key={d.id_docente} value={String(d.id_docente)}>
                          {d.apellidos_docente} {d.nombres_docente} — {d.nombre_usuario}
                        </option>
                      ))}
                    </select>
                  </div>

                  {loadingDocentes ? <div className="pcpHint">Cargando docentes...</div> : null}

                  <div className="pcpModalFooter">
                    <button className="dmBtnGhost" onClick={closeAssign} disabled={assignSaving} type="button">
                      Cancelar
                    </button>

                    <button
                      className="btnPrimary"
                      onClick={onSaveAssignWithAdmins}
                      disabled={assignSaving || !hasCarreraSelected || !dirIdNew || !apoIdNew || dirIdNew === apoIdNew}
                      type="button"
                    >
                      <Save size={16} /> {assignSaving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL AUTORIDADES */}
          {showAuthModal && selectedCP && (
            <div className="pcpOverlay" onClick={closeAutoridadesModal}>
              <div className="pcpModal pcpModalSm" onClick={(e) => e.stopPropagation()}>
                <div className="pcpModalHeader">
                  <div className="pcpModalHeaderLeft">
                    <div className="pcpModalIcon">
                      <Users size={18} />
                    </div>
                    <div className="pcpModalHeaderText">
                      <div className="pcpModalTitle">Autoridades</div>
                      <div className="pcpModalSub">{(selectedCP as any).nombre_carrera || "Carrera"}</div>
                    </div>
                  </div>

                  <button className="pcpModalClose" onClick={closeAutoridadesModal} aria-label="Cerrar" type="button">
                    <X size={18} />
                  </button>
                </div>

                <div className="pcpModalBody">
                  <div className="pcpAuthGrid">
                    <div className="pcpAuthBox">
                      <div className="pcpAuthK">Director actual</div>
                      <div className="pcpAuthV">{admins ? formatAdminLite(admins.director) : "—"}</div>
                    </div>
                    <div className="pcpAuthBox">
                      <div className="pcpAuthK">Apoyo actual</div>
                      <div className="pcpAuthV">{admins ? formatAdminLite(admins.apoyo) : "—"}</div>
                    </div>
                  </div>

                  {authLoading ? (
                    <div className="pcpHint">Cargando autoridades...</div>
                  ) : (
                    <>
                      <div className="pcpField">
                        <label>Director</label>
                        <select
                          value={dirId}
                          onChange={(e) => setDirId(e.target.value)}
                          disabled={loadingDocentes || authSaving}
                        >
                          <option value="">(Sin asignar)</option>
                          {docentes.map((d: any) => (
                            <option key={d.id_docente} value={String(d.id_docente)}>
                              {d.apellidos_docente} {d.nombres_docente} — {d.nombre_usuario}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pcpField">
                        <label>Apoyo</label>
                        <select
                          value={apoId}
                          onChange={(e) => setApoId(e.target.value)}
                          disabled={loadingDocentes || authSaving}
                        >
                          <option value="">(Sin asignar)</option>
                          {docentes.map((d: any) => (
                            <option key={d.id_docente} value={String(d.id_docente)}>
                              {d.apellidos_docente} {d.nombres_docente} — {d.nombre_usuario}
                            </option>
                          ))}
                        </select>
                      </div>

                      {loadingDocentes ? <div className="pcpHint">Cargando docentes...</div> : null}
                    </>
                  )}

                  <div className="pcpModalFooter">
                    <button className="dmBtnGhost" onClick={closeAutoridadesModal} disabled={authSaving} type="button">
                      Cancelar
                    </button>
                    <button
                      className="btnPrimary"
                      onClick={onSaveAutoridades}
                      disabled={authSaving || authLoading || (dirId !== "" && apoId !== "" && dirId === apoId)}
                      type="button"
                    >
                      {authSaving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
        </div>
      </div>
    </div>
  );
}
