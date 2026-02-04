// src/pages/franjasHorarias/FranjaHorariaPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import type { FranjaHorario, Estado01 } from "../../types/franjaHoraria";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { PeriodoAcademico } from "../../types/periodoAcademico";

import { franjaHorarioService } from "../../services/franjasHorarias.service";
import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { periodosService } from "../../services/periodos.service";

import {
  Plus,
  Pencil,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  ArrowLeft,
  RefreshCw,
  Calendar,
} from "lucide-react";

import "./FranjaHorariaPage.css";

const PAGE_SIZE = 10;

type ToastType = "success" | "error" | "info";

type FranjaFormState = {
  id_carrera_periodo: number | "";
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  hora_fin: string; // HH:MM
  laboratorio: string;
};

const toYMD = (v: any) => (v ? String(v).slice(0, 10) : "");

function getIdFranja(f: any): number {
  return Number(f?.id_franja_horaria ?? f?.id_franja_horario ?? f?.id ?? 0);
}

export default function FranjaHorariaPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();

  // ✅ Si vienes desde PeriodoCarrerasPage, manda:
  // /franjas-horarias?carreraPeriodoId=XX&periodoId=YY&carrera=...
  const qpCarreraPeriodoId = Number(sp.get("carreraPeriodoId")) || 0;
  const qpPeriodoId = Number(sp.get("periodoId")) || 0;
  const qpCarreraNombre = decodeURIComponent(sp.get("carrera") || "");

  // ===========================
  // ESTADOS PRINCIPALES
  // ===========================
  const [carreraPeriodos, setCarreraPeriodos] = useState<CarreraPeriodo[]>([]);
  const [selectedCP, setSelectedCP] = useState<number | "">(qpCarreraPeriodoId || "");

  const [franjas, setFranjas] = useState<FranjaHorario[]>([]);
  const [loading, setLoading] = useState(false);

  // período (para min/max fecha)
  const [periodo, setPeriodo] = useState<PeriodoAcademico | null>(null);
  const periodoMin = toYMD(periodo?.fecha_inicio);
  const periodoMax = toYMD(periodo?.fecha_fin);

  // ===========================
  // FILTROS
  // ===========================
  const [search, setSearch] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState<string>(""); // YYYY-MM-DD o ""

  // ===========================
  // PAGINACIÓN
  // ===========================
  const [page, setPage] = useState(1);

  // ===========================
  // MODALES
  // ===========================
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editing, setEditing] = useState<FranjaHorario | null>(null);
  const [viewItem, setViewItem] = useState<FranjaHorario | null>(null);

  // ===========================
  // FORM
  // ===========================
  const [form, setForm] = useState<FranjaFormState>({
    id_carrera_periodo: "",
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    laboratorio: "",
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

  function estado01(v: any): 0 | 1 {
    return Number(v) === 1 ? 1 : 0;
  }
  function isActivo(v: any): boolean {
    return estado01(v) === 1;
  }

  function timeToMinutes(t: string): number {
    const parts = String(t || "").split(":").map((x) => Number(x));
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    return h * 60 + m;
  }

  function resetForm() {
    setEditing(null);
    setForm({
      id_carrera_periodo: selectedCP || "",
      fecha: fechaFiltro || "",
      hora_inicio: "",
      hora_fin: "",
      laboratorio: "",
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

  function openEdit(f: FranjaHorario) {
    setEditing(f);
    setForm({
      id_carrera_periodo: (f as any).id_carrera_periodo,
      fecha: toYMD((f as any).fecha),
      hora_inicio: String((f as any).hora_inicio || "").slice(0, 5),
      hora_fin: String((f as any).hora_fin || "").slice(0, 5),
      laboratorio: String((f as any).laboratorio ?? ""),
    });
    setErrors({});
    setShowFormModal(true);
  }

  function openView(f: FranjaHorario) {
    setViewItem(f);
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

    return "Error al guardar franja horaria";
  }

  // ===========================
  // CARGA INICIAL
  // ===========================
  useEffect(() => {
    loadCarreraPeriodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // ✅ si viene periodoId por query, traemos min/max
    if (qpPeriodoId) loadPeriodo(qpPeriodoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qpPeriodoId]);

  useEffect(() => {
    if (selectedCP) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCP, mostrarInactivos, fechaFiltro]);

  async function loadPeriodo(idPeriodo: number) {
    try {
      const all = await periodosService.list({ includeInactive: true });
      const p = (all || []).find((x: any) => Number(x.id_periodo) === Number(idPeriodo)) || null;
      setPeriodo(p);
    } catch {
      setPeriodo(null);
    }
  }

  async function loadCarreraPeriodos() {
    try {
      setLoading(true);

      const cps = await carreraPeriodoService.list(false);
      setCarreraPeriodos(cps);

      // ✅ si no venía por query, elige el primero activo
      if (!qpCarreraPeriodoId) {
        const first = cps.find((x: any) => Boolean(x.estado)) ?? cps[0];
        if (first) setSelectedCP(first.id_carrera_periodo);
      }
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
      const data = await franjaHorarioService.list({
        includeInactive: mostrarInactivos,
        carreraPeriodoId: Number(selectedCP),
        fecha: fechaFiltro || undefined,
        q: search.trim() || undefined,
        page: 1,
        limit: 100,
      });
      setFranjas(data);
    } catch {
      showToast("Error al cargar franjas horarias", "error");
      setFranjas([]);
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // FILTRADO + ORDEN + PAGINACIÓN
  // ===========================
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return franjas
      .filter((f: any) => (mostrarInactivos ? true : isActivo((f as any).estado)))
      .filter((f: any) => {
        if (!q) return true;
        return (
          String((f as any).laboratorio || "").toLowerCase().includes(q) ||
          String((f as any).fecha || "").toLowerCase().includes(q) ||
          String((f as any).hora_inicio || "").toLowerCase().includes(q) ||
          String((f as any).hora_fin || "").toLowerCase().includes(q)
        );
      })
      .sort((a: any, b: any) => {
        const keyA = `${a.fecha || ""} ${a.hora_inicio || ""}`;
        const keyB = `${b.fecha || ""} ${b.hora_inicio || ""}`;
        return keyA.localeCompare(keyB, "es");
      });
  }, [franjas, search, mostrarInactivos]);

  useEffect(() => {
    setPage(1);
  }, [search, mostrarInactivos, selectedCP, fechaFiltro]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const total = franjas.length;
  const activos = franjas.filter((f: any) => isActivo(f.estado)).length;
  const inactivos = total - activos;

  const selectedCPLabel = useMemo(() => {
    const cp = carreraPeriodos.find((x) => x.id_carrera_periodo === selectedCP);
    if (!cp) return "";
    const carrera = (cp as any).nombre_carrera ?? "Carrera";
    const periodoTxt = (cp as any).codigo_periodo ?? (cp as any).descripcion_periodo ?? "Período";
    return `${carrera} — ${periodoTxt}`;
  }, [carreraPeriodos, selectedCP]);

  // ===========================
  // VALIDACIONES FRONT (UX)
  // ===========================
  function validateForm(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!form.id_carrera_periodo) e.id_carrera_periodo = "Seleccione Carrera–Período.";

    if (!form.fecha.trim()) e.fecha = "Fecha obligatoria (YYYY-MM-DD).";
    if (form.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(form.fecha.trim())) e.fecha = "Formato inválido (YYYY-MM-DD).";

    // ✅ rango según período (si existe)
    if (periodoMin && form.fecha && form.fecha < periodoMin) e.fecha = "Fecha fuera del rango del período (antes del inicio).";
    if (periodoMax && form.fecha && form.fecha > periodoMax) e.fecha = "Fecha fuera del rango del período (después del fin).";

    if (!form.hora_inicio.trim()) e.hora_inicio = "Hora inicio obligatoria.";
    if (!form.hora_fin.trim()) e.hora_fin = "Hora fin obligatoria.";

    if (form.hora_inicio && !/^\d{2}:\d{2}$/.test(form.hora_inicio.trim())) e.hora_inicio = "Formato inválido (HH:MM).";
    if (form.hora_fin && !/^\d{2}:\d{2}$/.test(form.hora_fin.trim())) e.hora_fin = "Formato inválido (HH:MM).";

    if (form.hora_inicio && form.hora_fin) {
      if (timeToMinutes(form.hora_inicio.trim()) >= timeToMinutes(form.hora_fin.trim())) {
        e.hora_inicio = "hora_inicio debe ser menor que hora_fin.";
        e.hora_fin = "hora_fin debe ser mayor que hora_inicio.";
      }
    }

    if (!form.laboratorio.trim()) e.laboratorio = "Laboratorio obligatorio.";
    if (form.laboratorio.trim().length > 30) e.laboratorio = "Máximo 30 caracteres.";

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
        fecha: form.fecha.trim(),
        hora_inicio: form.hora_inicio.trim(),
        hora_fin: form.hora_fin.trim(),
        laboratorio: form.laboratorio.trim(),
      };

      if (editing) {
        const id = getIdFranja(editing);
        await franjaHorarioService.update(id, payload);
        showToast("Franja horaria actualizada.", "success");
      } else {
        await franjaHorarioService.create(payload);
        showToast("Franja horaria creada.", "success");
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

  async function onToggleEstado(f: FranjaHorario) {
    try {
      setLoading(true);

      const id = getIdFranja(f);
      const current: Estado01 = estado01((f as any).estado) as Estado01;

      await franjaHorarioService.toggleEstado(id, current);
      showToast(current === 1 ? "Franja desactivada." : "Franja activada.", "success");

      await loadAll();
    } catch {
      showToast("No se pudo cambiar el estado.", "error");
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="fhPage">
      {/* HERO */}
      <div className="fhHero">
        <div className="fhHeroLeft">
          <button className="fhHeroBtn ghost" onClick={() => nav(-1)} type="button">
            <ArrowLeft size={18} /> Volver
          </button>

          <div className="fhHeroText">
            <div className="fhHeroTitle">Franjas horarias</div>
            <div className="fhHeroSub">
              {qpCarreraNombre ? <b>{qpCarreraNombre}</b> : null}
              {selectedCPLabel ? (qpCarreraNombre ? " — " : "") : null}
              {selectedCPLabel ? selectedCPLabel : null}
            </div>
            {periodoMin && periodoMax ? (
              <div className="fhHeroSub">{periodoMin} → {periodoMax}</div>
            ) : null}
          </div>
        </div>

        <div className="fhHeroActions">
          <button className="fhHeroBtn primary" onClick={openCreate} disabled={loading} type="button">
            <Plus size={18} /> Nueva franja
          </button>
        </div>
      </div>

      {/* CARD PRINCIPAL */}
      <div className="fhCard">
        {/* RESUMEN + ACCIONES */}
        <div className="fhTopRow">
          <div className="fhSummary">
            <div className="fhBox">
              <span className="k">Total</span>
              <span className="v">{total}</span>
            </div>
            <div className="fhBox ok">
              <span className="k">Activos</span>
              <span className="v">{activos}</span>
            </div>
            <div className="fhBox bad">
              <span className="k">Inactivos</span>
              <span className="v">{inactivos}</span>
            </div>
          </div>

          <div className="fhTopActions">
            <label className="fhToggle">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(ev) => setMostrarInactivos(ev.target.checked)}
              />
              <span className="fhSlider" />
              <span className="fhToggleText">Mostrar inactivos</span>
            </label>

            <button className="fhIconBtn" onClick={loadAll} title="Actualizar" type="button" disabled={loading}>
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* FILTROS (ya no amontonados) */}
        <div className="fhFilters">
          <div className="fhFieldBlock">
            <label className="fhLabel">Carrera–Período</label>
            <select
              className={`fhSelect ${errors.id_carrera_periodo ? "input-error" : ""}`}
              value={selectedCP}
              onChange={(e) => setSelectedCP((e.target.value ? Number(e.target.value) : "") as any)}
              disabled={loading}
            >
              <option value="">Seleccione Carrera–Período</option>
              {carreraPeriodos.map((cp: any) => {
                const carrera = cp.nombre_carrera ?? `Carrera ${cp.id_carrera}`;
                const periodoTxt = cp.codigo_periodo ?? cp.descripcion_periodo ?? `Período ${cp.id_periodo}`;
                return (
                  <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                    {carrera} — {periodoTxt}
                  </option>
                );
              })}
            </select>
            {errors.id_carrera_periodo && <div className="field-error">{errors.id_carrera_periodo}</div>}
          </div>

          <div className="fhFieldBlock">
            <label className="fhLabel">Fecha</label>
            <div className="fhDateRow">
              <div className="fhDateWrap">
                <Calendar size={16} />
                <input
                  type="date"
                  className="fhDate"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                  disabled={!selectedCP || loading}
                  min={periodoMin || undefined}
                  max={periodoMax || undefined}
                />
              </div>
              <button className="fhGhostBtn" onClick={() => setFechaFiltro("")} disabled={!fechaFiltro} type="button">
                Limpiar
              </button>
            </div>
          </div>

          <div className="fhFieldBlock">
            <label className="fhLabel">Buscar</label>
            <div className="fhSearch">
              <Search size={18} />
              <input
                type="text"
                placeholder="Laboratorio, fecha u hora…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="fhCard fhTableCard">
        <div className="fhTableWrap">
          <table className="fhTable">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora inicio</th>
                <th>Hora fin</th>
                <th>Laboratorio</th>
                <th>Estado</th>
                <th className="thActions">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ padding: 16 }}>
                    Cargando...
                  </td>
                </tr>
              ) : pageData.length ? (
                pageData.map((f: any) => {
                  const activo = isActivo(f.estado);
                  const id = getIdFranja(f);

                  return (
                    <tr key={id}>
                      <td className="tdCode">{toYMD(f.fecha)}</td>
                      <td className="tdStrong">{String(f.hora_inicio || "").slice(0, 5)}</td>
                      <td className="tdStrong">{String(f.hora_fin || "").slice(0, 5)}</td>
                      <td>{f.laboratorio || "-"}</td>

                      <td>
                        <span className={`badge ${activo ? "badge-success" : "badge-danger"}`}>
                          {activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="actions">
                        <button className="btnIcon btnView" title="Ver" onClick={() => openView(f)} type="button">
                          <Eye size={16} />
                        </button>

                        <button className="btnIcon btnEdit" title="Editar" onClick={() => openEdit(f)} type="button">
                          <Pencil size={16} />
                        </button>

                        <button
                          className={`btnIcon ${activo ? "btnDeactivate" : "btnActivate"}`}
                          title={activo ? "Desactivar" : "Activar"}
                          onClick={() => onToggleEstado(f)}
                          type="button"
                        >
                          {activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="muted" style={{ padding: 16 }}>
                    No hay franjas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINACIÓN */}
      <div className="fhCard fhPagination">
        <div className="paginationCenter">
          <button className="fhGhostBtn" disabled={page === 1} onClick={() => setPage((p) => p - 1)} type="button">
            ← Anterior
          </button>

          <span className="muted">
            Página {page} de {totalPages}
          </span>

          <button
            className="fhGhostBtn"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            type="button"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {showFormModal && (
        <div className="modalOverlay" onClick={() => setShowFormModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">{editing ? "Editar franja" : "Nueva franja"}</div>
              <button className="modalClose" onClick={() => setShowFormModal(false)} type="button">
                ✕
              </button>
            </div>

            <div className="modalBody formStack">
              <div className="formField">
                <label className="label">Carrera–Período *</label>
                <select
                  className={`fieldSelect ${errors.id_carrera_periodo ? "input-error" : ""}`}
                  value={form.id_carrera_periodo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, id_carrera_periodo: e.target.value ? Number(e.target.value) : "" }))
                  }
                >
                  <option value="">Seleccione Carrera–Período</option>
                  {carreraPeriodos.map((cp: any) => {
                    const carrera = cp.nombre_carrera ?? `Carrera ${cp.id_carrera}`;
                    const periodoTxt = cp.codigo_periodo ?? cp.descripcion_periodo ?? `Período ${cp.id_periodo}`;
                    return (
                      <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                        {carrera} — {periodoTxt}
                      </option>
                    );
                  })}
                </select>
                {errors.id_carrera_periodo && <div className="field-error">{errors.id_carrera_periodo}</div>}
              </div>

              <div className="formField">
                <label className="label">Fecha *</label>
                <input
                  type="date"
                  className={`fieldInput ${errors.fecha ? "input-error" : ""}`}
                  value={form.fecha}
                  min={periodoMin || undefined}
                  max={periodoMax || undefined}
                  onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                />
                {errors.fecha && <div className="field-error">{errors.fecha}</div>}
              </div>

              <div className="twoCols">
                <div className="formField">
                  <label className="label">Hora inicio *</label>
                  <input
                    type="time"
                    className={`fieldInput ${errors.hora_inicio ? "input-error" : ""}`}
                    value={form.hora_inicio}
                    onChange={(e) => setForm((p) => ({ ...p, hora_inicio: e.target.value }))}
                  />
                  {errors.hora_inicio && <div className="field-error">{errors.hora_inicio}</div>}
                </div>

                <div className="formField">
                  <label className="label">Hora fin *</label>
                  <input
                    type="time"
                    className={`fieldInput ${errors.hora_fin ? "input-error" : ""}`}
                    value={form.hora_fin}
                    onChange={(e) => setForm((p) => ({ ...p, hora_fin: e.target.value }))}
                  />
                  {errors.hora_fin && <div className="field-error">{errors.hora_fin}</div>}
                </div>
              </div>

              <div className="formField">
                <label className="label">Laboratorio *</label>
                <input
                  className={`fieldInput ${errors.laboratorio ? "input-error" : ""}`}
                  value={form.laboratorio}
                  onChange={(e) => setForm((p) => ({ ...p, laboratorio: e.target.value }))}
                  placeholder="Ej: LAB-1"
                />
                {errors.laboratorio && <div className="field-error">{errors.laboratorio}</div>}
              </div>
            </div>

            <div className="modalFooter">
              <button className="fhGhostBtn" onClick={() => setShowFormModal(false)} type="button">
                Cancelar
              </button>

              <button className="fhPrimaryBtn" onClick={onSave} disabled={loading} type="button">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER */}
      {showViewModal && viewItem && (
        <div className="modalOverlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">Detalle de franja</div>
              <button className="modalClose" onClick={() => setShowViewModal(false)} type="button">
                ✕
              </button>
            </div>

            <div className="modalBody viewGrid">
              <div className="viewItem">
                <div className="viewKey">Fecha</div>
                <div className="viewVal tdCode">{toYMD((viewItem as any).fecha)}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Horario</div>
                <div className="viewVal">
                  {String((viewItem as any).hora_inicio || "").slice(0, 5)} — {String((viewItem as any).hora_fin || "").slice(0, 5)}
                </div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Laboratorio</div>
                <div className="viewVal">{String((viewItem as any).laboratorio || "-")}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Carrera–Período</div>
                <div className="viewVal">{selectedCPLabel || String((viewItem as any).id_carrera_periodo)}</div>
              </div>

              <div className="viewItem viewItemFull">
                <div className="viewKey">Estado</div>
                <div className="viewVal">
                  <span className={`badge ${isActivo((viewItem as any).estado) ? "badge-success" : "badge-danger"}`}>
                    {isActivo((viewItem as any).estado) ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="viewItem viewItemFull">
                <div className="viewKey">Creado</div>
                <div className="viewVal">{(viewItem as any).created_at || "-"}</div>
              </div>
            </div>

            <div className="modalFooter">
              <button className="fhGhostBtn" onClick={() => setShowViewModal(false)} type="button">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
