// src/pages/periodos/PeriodoCarrerasPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Users, Plus, Search, RefreshCw, Filter, X, Save } from "lucide-react";

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
  const full = `${a.apellidos_docente} ${a.nombres_docente}`.trim();
  const user = a.nombre_usuario ? ` (${a.nombre_usuario})` : "";
  return full + user;
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

  // filtros lista (cards)
  const [q, setQ] = useState<string>("");
  const [includeInactive, setIncludeInactive] = useState<boolean>(true);
  const [deptId, setDeptId] = useState<string>("");

  // ✅ flags booleanos puros (evitan boolean | "")
  const hasDeptSelected = deptId !== "";

  // debounce search
  const [qDebounced, setQDebounced] = useState<string>("");
  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  // opcional: traer admins en tarjetas (costo extra)
  const [loadAdminsInCards, setLoadAdminsInCards] = useState<boolean>(false);

  // =========================
  // Modal ASIGNAR (1 por 1) + autoridades en el MISMO modal
  // =========================
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assignSaving, setAssignSaving] = useState<boolean>(false);

  const [selectedCarreraId, setSelectedCarreraId] = useState<string>("");
  const hasCarreraSelected = selectedCarreraId !== "";

  const [showAllDocentes, setShowAllDocentes] = useState<boolean>(false);

  const [dirIdNew, setDirIdNew] = useState<string>("");
  const [apoIdNew, setApoIdNew] = useState<string>("");

  // =========================
  // Modal Autoridades (desde card)
  // =========================
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authSaving, setAuthSaving] = useState<boolean>(false);

  const [selectedCP, setSelectedCP] = useState<CarreraPeriodo | null>(null);
  const [admins, setAdmins] = useState<CarreraPeriodoAdminsResponse | null>(null);

  const [dirId, setDirId] = useState<string>("");
  const [apoId, setApoId] = useState<string>("");

  const [docentes, setDocentes] = useState<any[]>([]);
  const [loadingDocentes, setLoadingDocentes] = useState<boolean>(false);

  // evitar setState si se desmonta
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
      // ⚠️ includeInactive siempre boolean (evita boolean|"")
      const data = await carreraPeriodoService.listByPeriodo(periodoId, {
        includeInactive: Boolean(includeInactive),
        q: qDebounced.trim() || undefined,
      });

      let list = (data ?? []) as any[];

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
  }, [includeInactive, qDebounced, loadAdminsInCards]);

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
    // Solo carreras NO asignadas (para el modal)
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
    // si aún no elige carrera, no filtres (para no confundir)
    const idCarr = Number(selectedCarreraId);
    if (!idCarr) return docentes;

    if (showAllDocentes) return docentes;

    const car = carreraById.get(idCarr);
    const deptCarr = getCarreraDeptId(car);
    if (!deptCarr) return docentes;

    return (docentes ?? []).filter((d: any) => getDocenteDeptId(d) === deptCarr);
  }, [docentes, showAllDocentes, selectedCarreraId, carreraById]);

  // =========================
  // MODAL ASIGNAR (1 por 1) + autoridades
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
      // 1) crear carrera-periodo (bulk con 1 id) — y usar la respuesta del backend
      const bulkRes = await carreraPeriodoService.bulkAssign({
        id_periodo: periodoId,
        carreraIds: [idCarrera],
      });

      // 2) obtener id_carrera_periodo desde respuesta
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

      // 3) guardar autoridades
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
  // Modal Autoridades (desde card)
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
  // Render
  // =========================
  return (
    <div className="pcp-page">
      {/* HERO */}
      <div className="pcp-hero">
        <div className="pcp-heroLeft">
          <button className="pcp-back" onClick={() => nav("/periodos")} type="button">
            <ArrowLeft size={16} /> Volver
          </button>

          <div className="pcp-heroText">
            <h1 className="pcp-title">{title}</h1>
            <div className="pcp-sub">{subtitle}</div>
            {rango ? <div className="pcp-range">{rango}</div> : null}
          </div>
        </div>

        <div className="pcp-heroActions">
          <button className="pcp-btn pcp-btnPrimary" onClick={openAssign} disabled={loading} type="button">
            <Plus size={16} /> Asignar carrera
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="pcp-box">
        <div className="pcp-boxHead">
          <div className="pcp-sectionTitle">
            Carreras del período <span className="pcp-pill">{itemsFiltered.length}</span>
          </div>

          <div className="pcp-right">
            <div className="pcp-searchWrap">
              <Search size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar carrera…" />
            </div>

            {/* filtro por departamento */}
            <div className="pcp-selectWrap" title="Filtrar por departamento">
              <Filter size={16} />
              <select value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                <option value="">Todos los departamentos</option>
                {departamentos.map((d: any) => (
                  <option key={d.id_departamento} value={String(d.id_departamento)}>
                    {d.nombre_departamento}
                  </option>
                ))}
              </select>
            </div>

            <label className="pcp-toggle" title="Incluir carreras inactivas">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              <span className="pcp-toggleSlider" />
              <span className="pcp-toggleText">Incluir inactivas</span>
            </label>

            <label className="pcp-toggle" title="Mostrar Director/Apoyo en cada card (puede demorar)">
              <input
                type="checkbox"
                checked={loadAdminsInCards}
                onChange={(e) => setLoadAdminsInCards(e.target.checked)}
              />
              <span className="pcp-toggleSlider" />
              <span className="pcp-toggleText">Ver autoridades</span>
            </label>

            <button
              className="pcp-btn pcp-btnIcon"
              onClick={() => loadItems()}
              disabled={loading}
              title="Refrescar"
              type="button"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="pcp-empty">Cargando…</div>
        ) : itemsFiltered.length === 0 ? (
          <div className="pcp-empty">No hay carreras asignadas.</div>
        ) : (
          <div className="pcp-cards">
            {itemsFiltered.map((x: any) => {
              const activo = isActive(x.estado);

              return (
                <div className="pcp-card" key={x.id_carrera_periodo}>
                  <div className="pcp-cardLeft">
                    <div className="pcp-name">{x.nombre_carrera || "—"}</div>
                    <div className="pcp-meta">{carreraMeta(x) || "—"}</div>

                    {loadAdminsInCards ? (
                      <div className="pcp-admins">
                        <div className="pcp-adminRow">
                          <span className="pcp-k">Director:</span>
                          <span className="pcp-v">{formatAdminLite((x as any).director)}</span>
                        </div>
                        <div className="pcp-adminRow">
                          <span className="pcp-k">Apoyo:</span>
                          <span className="pcp-v">{formatAdminLite((x as any).apoyo)}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="pcp-cardRight">
                    <span className={`pcp-badge ${activo ? "active" : "inactive"}`}>
                      {activo ? "ACTIVO" : "INACTIVO"}
                    </span>

                    <button
                      className="pcp-iconBtn"
                      title="Autoridades (Director / Apoyo)"
                      onClick={() => openAutoridadesModal(x)}
                      disabled={!activo}
                      type="button"
                    >
                      <Users size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================
          MODAL ASIGNAR (1 carrera) + autoridades
         ========================= */}
      {showAssignModal && (
        <div className="pcp-overlay" onClick={closeAssign}>
          <div className="pcp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pcp-modalHead">
              <div>
                <div className="pcp-modalTitle">Asignar carrera + autoridades</div>
                <div className="pcp-modalSub">{title}</div>
              </div>
              <button className="pcp-x" onClick={closeAssign} aria-label="Cerrar" type="button">
                <X size={18} />
              </button>
            </div>

            <div className="pcp-modalBody">
              <div className="pcp-field">
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
                <div className="pcp-muted" style={{ marginTop: 6 }}>
                  Solo aparecen carreras que aún no están asignadas al período.
                </div>
              </div>

              <label className="pcp-toggle" title="Por defecto se muestran docentes del departamento de la carrera">
                <input
                  type="checkbox"
                  checked={showAllDocentes}
                  onChange={(e) => setShowAllDocentes(e.target.checked)}
                  disabled={assignSaving || loadingDocentes || !hasCarreraSelected}
                />
                <span className="pcp-toggleSlider" />
                <span className="pcp-toggleText">Mostrar docentes de todos los departamentos</span>
              </label>

              <div className="pcp-field">
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

              <div className="pcp-field">
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

              {loadingDocentes ? <div className="pcp-muted">Cargando docentes...</div> : null}

              <div className="pcp-modalFooter">
                <button className="pcp-ghost" onClick={closeAssign} disabled={assignSaving} type="button">
                  Cancelar
                </button>

                <button
                  className="pcp-primary"
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

      {/* =========================
          MODAL AUTORIDADES (desde card)
         ========================= */}
      {showAuthModal && selectedCP && (
        <div className="pcp-overlay" onClick={closeAutoridadesModal}>
          <div className="pcp-modal pcp-modalSm" onClick={(e) => e.stopPropagation()}>
            <div className="pcp-modalHead">
              <div>
                <div className="pcp-modalTitle">Autoridades</div>
                <div className="pcp-modalSub">{(selectedCP as any).nombre_carrera || "Carrera"}</div>
              </div>
              <button className="pcp-x" onClick={closeAutoridadesModal} aria-label="Cerrar" type="button">
                ✕
              </button>
            </div>

            <div className="pcp-modalBody">
              <div className="pcp-authCurrent">
                <div className="pcp-authBox">
                  <div className="pcp-authK">Director actual</div>
                  <div className="pcp-authV">{admins ? formatAdminLite(admins.director) : "—"}</div>
                </div>
                <div className="pcp-authBox">
                  <div className="pcp-authK">Apoyo actual</div>
                  <div className="pcp-authV">{admins ? formatAdminLite(admins.apoyo) : "—"}</div>
                </div>
              </div>

              {authLoading ? (
                <div className="pcp-muted">Cargando autoridades...</div>
              ) : (
                <>
                  <div className="pcp-field">
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

                  <div className="pcp-field">
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

                  {loadingDocentes ? <div className="pcp-muted">Cargando docentes...</div> : null}
                </>
              )}

              <div className="pcp-modalFooter">
                <button className="pcp-ghost" onClick={closeAutoridadesModal} disabled={authSaving} type="button">
                  Cancelar
                </button>
                <button
                  className="pcp-primary"
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

      {toast && <div className={`pcp-toast pcp-toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
