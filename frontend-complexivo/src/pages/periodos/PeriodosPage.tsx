// src/pages/periodos/PeriodosPage.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  X,
  Save,
  Hash,
  AlignLeft,
  CalendarDays,
  CalendarCheck2,
  BadgeCheck,
  RotateCw,
  Filter,
} from "lucide-react";

import "./PeriodosPage.css";
import escudoESPE from "../../assets/escudo.png";

import {
  periodosService,
  type PeriodoCreateDTO,
  type PeriodoUpdateDTO,
} from "../../services/periodos.service";

import type { PeriodoAcademico } from "../../types/periodoAcademico";

const PAGE_SIZE = 10;

function normalizeToYMD(v: any): string {
  if (!v) return "";
  const s = String(v).trim();

  // ISO (YYYY-MM-DD...)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  return s.length >= 10 ? s.slice(0, 10) : s;
}

function ymdToDate(ymd: string, endOfDay = false): Date | null {
  if (!ymd) return null;
  const iso = endOfDay ? `${ymd}T23:59:59` : `${ymd}T00:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

const isActive = (estado?: boolean | number | null) => {
  if (estado === undefined || estado === null) return false;
  return typeof estado === "boolean" ? estado : Number(estado) === 1;
};

type ToastType = "success" | "error" | "info";

export default function PeriodosPage() {
  const navigate = useNavigate();

  // ✅ loading separado
  const [loadingTable, setLoadingTable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  // data
  const [rows, setRows] = useState<PeriodoAcademico[]>([]);

  // filtros (inputs)
  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // filtros aplicados (solo cambian con Buscar)
  const [applied, setApplied] = useState<{ q: string; from: string; to: string }>({
    q: "",
    from: "",
    to: "",
  });

  // paginación
  const [page, setPage] = useState(1);

  // modal create/edit
  const [modalMode, setModalMode] = useState<null | "create" | "edit">(null);
  const [selected, setSelected] = useState<PeriodoAcademico | null>(null);

  // form
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [formErr, setFormErr] = useState<Record<string, string>>({});

  function resetForm() {
    setCodigo("");
    setDescripcion("");
    setFechaInicio("");
    setFechaFin("");
    setFormErr({});
  }

  function openCreate() {
    resetForm();
    setSelected(null);
    setModalMode("create");
  }

  function openEdit(p: PeriodoAcademico) {
    setSelected(p);
    setCodigo(p.codigo_periodo || "");
    setDescripcion(p.descripcion_periodo || "");
    setFechaInicio(normalizeToYMD(p.fecha_inicio));
    setFechaFin(normalizeToYMD(p.fecha_fin));
    setFormErr({});
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelected(null);
    resetForm();
  }

  function goToCarrerasPeriodo(p: PeriodoAcademico) {
    navigate(`/periodos/${p.id_periodo}/carreras`);
  }

  // ✅ Fetch con flags separados
  const fetchList = async (opts?: { silent?: boolean }) => {
    if (opts?.silent) {
      setRefreshing(true);
    } else {
      setLoadingTable(true);
    }
    setErrorMsg(null);

    try {
      const data = await periodosService.list({
        includeInactive,
        q: undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErrorMsg(e?.userMessage || "Error cargando períodos");
      setRows([]);
    } finally {
      setRefreshing(false);
      setLoadingTable(false);
    }
  };

  // ✅ SOLO UN useEffect (montaje + cuando cambie includeInactive)
  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  function applyFilters() {
    setApplied({ q: q.trim(), from, to });
    setPage(1);
  }

  function clearFilters() {
    setQ("");
    setFrom("");
    setTo("");
    setApplied({ q: "", from: "", to: "" });
    setPage(1);
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  }

  const filtered = useMemo(() => {
    const term = applied.q.trim().toLowerCase();
    const f = applied.from ? ymdToDate(applied.from, false) : null;
    const t = applied.to ? ymdToDate(applied.to, true) : null;

    return (rows ?? []).filter((p) => {
      if (term) {
        const a = String(p.codigo_periodo || "").toLowerCase();
        const b = String(p.descripcion_periodo || "").toLowerCase();
        if (!a.includes(term) && !b.includes(term)) return false;
      }

      const fiYMD = normalizeToYMD(p.fecha_inicio);
      const ffYMD = normalizeToYMD(p.fecha_fin);

      const fi = fiYMD ? ymdToDate(fiYMD, false) : null;
      const ff = ffYMD ? ymdToDate(ffYMD, true) : null;

      if (f && ff && ff < f) return false;
      if (t && fi && fi > t) return false;

      return true;
    });
  }, [rows, applied]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const act = filtered.filter((x) => isActive(x.estado)).length;
    const inact = total - act;
    return { total, act, inact };
  }, [filtered]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length]
  );

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!codigo.trim()) e.codigo = "El código es obligatorio.";
    if (!descripcion.trim()) e.descripcion = "La descripción es obligatoria.";
    if (!fechaInicio) e.fechaInicio = "La fecha de inicio es obligatoria.";
    if (!fechaFin) e.fechaFin = "La fecha de fin es obligatoria.";

    if (fechaInicio && fechaFin) {
      const a = ymdToDate(fechaInicio, false);
      const b = ymdToDate(fechaFin, false);
      if (a && b && a > b) e.fechaFin = "La fecha fin debe ser mayor o igual a la fecha inicio.";
    }

    setFormErr(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: PeriodoCreateDTO | PeriodoUpdateDTO = {
        codigo_periodo: codigo.trim(),
        descripcion_periodo: descripcion.trim(),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };

      if (modalMode === "create") {
        await periodosService.create(payload as PeriodoCreateDTO);
        showToast("Período creado.", "success");
      } else if (modalMode === "edit" && selected) {
        await periodosService.update(selected.id_periodo, payload as PeriodoUpdateDTO);
        showToast("Período actualizado.", "success");
      }

      closeModal();
      await fetchList({ silent: true });
    } catch (err: any) {
      showToast(err?.userMessage || "No se pudo guardar.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(p: PeriodoAcademico) {
    const current = isActive(p.estado);
    setLoadingTable(true);
    try {
      await periodosService.toggleEstado(p.id_periodo, p.estado);
      showToast(current ? "Período inactivado." : "Período activado.", "success");
      await fetchList({ silent: true });
    } catch (e: any) {
      showToast(e?.userMessage || "No se pudo cambiar estado.", "error");
    } finally {
      setLoadingTable(false);
    }
  }

  return (
    <div className="wrap containerFull per3Page">
      {/* HERO */}
      <div className="hero">
        <div className="heroLeft">
          <img className="heroLogo" src={escudoESPE} alt="ESPE" />
          <div className="heroText">
            <h1 className="heroTitle">Períodos académicos</h1>
            <p className="heroSubtitle">Gestión de períodos (código, fechas y estado).</p>
          </div>
        </div>

        <div className="heroActions">
          <button className="heroBtn primary" onClick={openCreate} type="button">
            <Plus className="heroBtnIcon" /> Nuevo período
          </button>
        </div>
      </div>

      {/* BOX */}
      <div className="box">
        <div className="boxHead">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <CalendarDays size={18} />
            </span>
            Listado de períodos
          </div>

          <div className="boxRight">
            <button
              className="chipBtn"
              onClick={() => fetchList({ silent: true })}
              type="button"
              disabled={refreshing}
            >
              <RotateCw size={16} /> {refreshing ? "Actualizando..." : "Actualizar"}
            </button>

            <label className="toggle toggleBox">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              <span className="slider" />
              <span className="toggleText">Mostrar inactivos</span>
            </label>

            <button className="chipBtn" onClick={clearFilters} type="button" disabled={loadingTable}>
              <X size={16} /> Limpiar
            </button>
          </div>
        </div>

        {/* ✅ METRICAS (siempre visibles) */}
        <div className="summaryRow">
          <div className="summaryBoxes">
            <div className="summaryBox">
              <div className="summaryLabel">Total</div>
              <div className="summaryValue">{stats.total}</div>
            </div>

            <div className="summaryBox active">
              <div className="summaryLabel">Activos</div>
              <div className="summaryValue">{stats.act}</div>
            </div>

            <div className="summaryBox inactive">
              <div className="summaryLabel">Inactivos</div>
              <div className="summaryValue">{stats.inact}</div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filtersRow">
          <div className="searchWrap">
            <Search className="searchIcon" />
            <input
              className="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Buscar por código o descripción…"
            />
          </div>

          <div className="dateWrap">
            <span className="dateLabel">Desde</span>
            <input className="dateInput" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="dateWrap">
            <span className="dateLabel">Hasta</span>
            <input className="dateInput" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <button className="btnPrimary small" onClick={applyFilters} type="button" disabled={loadingTable}>
            <Filter size={16} /> Buscar
          </button>
        </div>

        {errorMsg && <div className="per3Error">{errorMsg}</div>}

        {/* TABLE */}
        <div className="tableWrap">
          <div className="tableScroll">
            <table className="table">
              <thead>
                <tr>
                  <th><span className="thIcon"><Hash size={16} /></span>Código</th>
                  <th><span className="thIcon"><AlignLeft size={16} /></span>Descripción</th>
                  <th><span className="thIcon"><CalendarDays size={16} /></span>Inicio</th>
                  <th><span className="thIcon"><CalendarCheck2 size={16} /></span>Fin</th>
                  <th className="thState"><span className="thIcon"><BadgeCheck size={16} /></span>Estado</th>
                  <th className="thActions">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loadingTable ? (
                  <tr><td colSpan={6} className="emptyCell">Cargando…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={6} className="emptyCell">Sin períodos</td></tr>
                ) : (
                  paged.map((p) => {
                    const activo = isActive(p.estado);
                    return (
                      <tr key={p.id_periodo}>
                        <td>{p.codigo_periodo || "—"}</td>
                        <td>{p.descripcion_periodo || "—"}</td>
                        <td>{normalizeToYMD(p.fecha_inicio) || "—"}</td>
                        <td>{normalizeToYMD(p.fecha_fin) || "—"}</td>

                        <td className="tdState">
                          <span className={activo ? "badgeActive" : "badgeInactive"}>
                            {activo ? "ACTIVO" : "INACTIVO"}
                          </span>
                        </td>

                        <td className="tdActions">
                          <div className="actions">
                            <button className="iconBtn iconBtn_neutral" onClick={() => goToCarrerasPeriodo(p)} type="button">
                              <Eye className="iconAction" />
                              <span className="tooltip">Ver carreras</span>
                            </button>

                            <button className="iconBtn iconBtn_purple" onClick={() => openEdit(p)} type="button">
                              <Pencil className="iconAction" />
                              <span className="tooltip">Editar</span>
                            </button>

                            <button
                              className={`iconBtn ${activo ? "iconBtn_danger" : "iconBtn_primary"}`}
                              onClick={() => onToggle(p)}
                              type="button"
                            >
                              {activo ? <ToggleRight className="iconAction" /> : <ToggleLeft className="iconAction" />}
                              <span className="tooltip">{activo ? "Inactivar" : "Activar"}</span>
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

        {/* PAGINATION */}
        <div className="paginationRow">
          <button className="btnGhost" onClick={() => setPage((x) => Math.max(1, x - 1))} disabled={page <= 1} type="button">
            ◀ Anterior
          </button>

          <span className="paginationText">
            Página <b>{page}</b> de <b>{pageCount}</b>
          </span>

          <button className="btnGhost" onClick={() => setPage((x) => Math.min(pageCount, x + 1))} disabled={page >= pageCount} type="button">
            Siguiente ▶
          </button>
        </div>
      </div>

      {/* MODAL create/edit */}
      {(modalMode === "create" || modalMode === "edit") && (
        <div className="dmOverlay" onClick={closeModal}>
          <div className="dmCard dmWide" onClick={(e) => e.stopPropagation()}>
            <div className="dmHeader">
              <div className="dmHeaderLeft">
                <div className="dmHeaderIcon"><CalendarDays size={18} /></div>
                <div className="dmHeaderText">
                  <div className="dmTitle">{modalMode === "create" ? "Nuevo período" : "Editar período"}</div>
                  <div className="dmSub">
                    {modalMode === "create"
                      ? "Registra un nuevo período académico."
                      : `Editando: ${selected?.codigo_periodo || ""}`}
                  </div>
                </div>
              </div>

              <button className="dmClose" onClick={closeModal} type="button" title="Cerrar">
                <X size={18} />
              </button>
            </div>

            <form className="dmBody" onSubmit={onSubmit}>
              <div className="per3-modalGrid">
                <div>
                  <label className="form-label">Código</label>
                  <input
                    className={`input-base ${formErr.codigo ? "input-error" : ""}`}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ej: 2025A"
                  />
                  {formErr.codigo && <div className="field-error">{formErr.codigo}</div>}
                </div>

                <div>
                  <label className="form-label">Descripción</label>
                  <input
                    className={`input-base ${formErr.descripcion ? "input-error" : ""}`}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej: Período ordinario 2025-A"
                  />
                  {formErr.descripcion && <div className="field-error">{formErr.descripcion}</div>}
                </div>

                <div>
                  <label className="form-label">Fecha inicio</label>
                  <input
                    type="date"
                    className={`input-base ${formErr.fechaInicio ? "input-error" : ""}`}
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                  {formErr.fechaInicio && <div className="field-error">{formErr.fechaInicio}</div>}
                </div>

                <div>
                  <label className="form-label">Fecha fin</label>
                  <input
                    type="date"
                    className={`input-base ${formErr.fechaFin ? "input-error" : ""}`}
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                  {formErr.fechaFin && <div className="field-error">{formErr.fechaFin}</div>}
                </div>
              </div>

              <div className="dmFooter">
                <button type="button" className="dmBtnGhost" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>

                <button type="submit" className="btnPrimary" disabled={saving}>
                  <Save size={16} /> {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
