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

const toYMD = (v: any) => (v ? String(v).slice(0, 10) : "");

const isActive = (estado?: boolean | number | null) => {
  if (estado === undefined || estado === null) return false;
  return typeof estado === "boolean" ? estado : Number(estado) === 1;
};

type ToastType = "success" | "error" | "info";

export default function PeriodosPage() {
  const navigate = useNavigate();

  // base
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  // data
  const [rows, setRows] = useState<PeriodoAcademico[]>([]);

  // filtros
  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [from, setFrom] = useState<string>(""); // YYYY-MM-DD
  const [to, setTo] = useState<string>(""); // YYYY-MM-DD

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
    setFechaInicio(toYMD(p.fecha_inicio));
    setFechaFin(toYMD(p.fecha_fin));
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


  // ===== Fetch períodos
  const fetchList = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await periodosService.list({
        includeInactive,
        q: q.trim() || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (e: any) {
      setErrorMsg(e?.userMessage || "Error cargando períodos");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  // ===== filtros en memoria (texto + rango de fechas)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const f = from ? new Date(from + "T00:00:00") : null;
    const t = to ? new Date(to + "T23:59:59") : null;

    return (rows ?? []).filter((p) => {
      // texto
      if (term) {
        const a = String(p.codigo_periodo || "").toLowerCase();
        const b = String(p.descripcion_periodo || "").toLowerCase();
        if (!a.includes(term) && !b.includes(term)) return false;
      }

      // rango fechas (intersección)
      const fi = p.fecha_inicio ? new Date(toYMD(p.fecha_inicio) + "T00:00:00") : null;
      const ff = p.fecha_fin ? new Date(toYMD(p.fecha_fin) + "T23:59:59") : null;

      if (f && ff && ff < f) return false;
      if (t && fi && fi > t) return false;

      return true;
    });
  }, [rows, q, from, to]);

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

  function clearFilters() {
    setQ("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  // ===== Validación
  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!codigo.trim()) e.codigo = "El código es obligatorio.";
    if (!descripcion.trim()) e.descripcion = "La descripción es obligatoria.";
    if (!fechaInicio) e.fechaInicio = "La fecha de inicio es obligatoria.";
    if (!fechaFin) e.fechaFin = "La fecha de fin es obligatoria.";

    if (fechaInicio && fechaFin) {
      const a = new Date(fechaInicio + "T00:00:00");
      const b = new Date(fechaFin + "T00:00:00");
      if (a > b) e.fechaFin = "La fecha fin debe ser mayor o igual a la fecha inicio.";
    }

    setFormErr(e);
    return Object.keys(e).length === 0;
  }

  // ===== Save (create/edit)
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
      await fetchList();
    } catch (err: any) {
      showToast(err?.userMessage || "No se pudo guardar.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ===== Toggle estado (icono)
  async function onToggle(p: PeriodoAcademico) {
    const current = isActive(p.estado);
    setLoading(true);
    try {
      await periodosService.toggleEstado(p.id_periodo, p.estado);
      showToast(current ? "Período inactivado." : "Período activado.", "success");
      await fetchList();
    } catch (e: any) {
      showToast(e?.userMessage || "No se pudo cambiar estado.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cp3-page per3">
      {/* HERO */}
      <div className="per3-hero">
        <div className="per3-heroLeft">
          <img className="per3-heroLogo" src={escudoESPE} alt="ESPE" />
          <div className="per3-heroText">
            <h1 className="per3-heroTitle">Períodos académicos</h1>
            <p className="per3-heroSub">Gestión de períodos (código, fechas y estado).</p>
          </div>
        </div>

        <div className="per3-heroActions">
          <button className="btn-primary" onClick={openCreate} type="button">
            <Plus size={16} /> Nuevo período
          </button>

          <label className="switch">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            <span className="slider" />
            <span className="switch-text">Mostrar inactivos</span>
          </label>

          {/* ✅ sin botón Actualizar */}
        </div>
      </div>

      {/* PANEL */}
      <div className="cp3-panel">
        <div className="per3-stats">
          <div className="per3-stat">
            <div className="per3-statK">Total</div>
            <div className="per3-statV">{stats.total}</div>
          </div>

          <div className="per3-stat ok">
            <div className="per3-statK">Activos</div>
            <div className="per3-statV">{stats.act}</div>
          </div>

          <div className="per3-stat bad">
            <div className="per3-statK">Inactivos</div>
            <div className="per3-statV">{stats.inact}</div>
          </div>
        </div>

        <div className="cp3-filters">
          <div className="per3-searchWrap">
            <Search size={16} />
            <input
              className="per3-searchInput"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por código o descripción…"
            />
          </div>

          <div className="per3-dateWrap">
            <span className="per3-dateLabel">Desde</span>
            <input
              className="input-base per3-date"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="per3-dateWrap">
            <span className="per3-dateLabel">Hasta</span>
            <input
              className="input-base per3-date"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <button className="btn-secondary" onClick={clearFilters} type="button">
            Limpiar
          </button>
        </div>

        {errorMsg && <div className="cp3-error">{errorMsg}</div>}
      </div>

      {/* TABLA */}
      <div className="cp3-card">
        <div className="cp3-table-scroll">
          <table className="cp3-table per3-table">
            <thead>
              <tr>
                <th>
                  <span className="thIcon"><Hash size={16} /></span>
                  Código
                </th>
                <th>
                  <span className="thIcon"><AlignLeft size={16} /></span>
                  Descripción
                </th>
                <th>
                  <span className="thIcon"><CalendarDays size={16} /></span>
                  Inicio
                </th>
                <th>
                  <span className="thIcon"><CalendarCheck2 size={16} /></span>
                  Fin
                </th>
                <th className="th-center">
                  <span className="thIcon"><BadgeCheck size={16} /></span>
                  Estado
                </th>
                <th className="cp3-actions-col th-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="td-center">Cargando…</td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="td-center">Sin períodos</td>
                </tr>
              ) : (
                paged.map((p) => {
                  const activo = isActive(p.estado);
                  return (
                    <tr key={p.id_periodo}>
                      <td className="td-normal">{p.codigo_periodo || "—"}</td>
                      <td className="td-normal">{p.descripcion_periodo || "—"}</td>
                      <td className="td-normal">{toYMD(p.fecha_inicio) || "—"}</td>
                      <td className="td-normal">{toYMD(p.fecha_fin) || "—"}</td>

                      <td className="td-center">
                        <span className={`badge ${activo ? "active" : "inactive"}`}>
                          {activo ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>

                      <td className="td-actions">
                        <div className="row-actions">
                          {/* ✅ VER -> navega */}
                          <button
                            className="btnIcon view"
                            onClick={() => goToCarrerasPeriodo(p)}
                            title="Ver carreras del período"
                            type="button"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            className="btnIcon edit"
                            onClick={() => openEdit(p)}
                            title="Editar"
                            type="button"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            className={`btnIcon ${activo ? "danger" : "ok"}`}
                            onClick={() => onToggle(p)}
                            title={activo ? "Inactivar" : "Activar"}
                            type="button"
                          >
                            {activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
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

        <div className="cp3-pagination">
          <button
            className="btn-page"
            onClick={() => setPage((x) => Math.max(1, x - 1))}
            disabled={page <= 1}
            type="button"
            aria-label="Página anterior"
          >
            ◀
          </button>

          <span className="page-info">
            Página <b>{page}</b> de <b>{pageCount}</b>
          </span>

          <button
            className="btn-page"
            onClick={() => setPage((x) => Math.min(pageCount, x + 1))}
            disabled={page >= pageCount}
            type="button"
            aria-label="Página siguiente"
          >
            ▶
          </button>
        </div>
      </div>

      {/* MODAL create/edit */}
      {(modalMode === "create" || modalMode === "edit") && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2 className="modal-title">
                  {modalMode === "create" ? "Nuevo período" : "Editar período"}
                </h2>
                <p className="modal-subtitle">
                  {modalMode === "create"
                    ? "Registra un nuevo período académico."
                    : `Editando: ${selected?.codigo_periodo || ""}`}
                </p>
              </div>

              <button className="icon-btn" onClick={closeModal} title="Cerrar" type="button">
                <X size={18} />
              </button>
            </div>

            <form className="modal-body" onSubmit={onSubmit}>
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

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>

                <button type="submit" className="btn-primary" disabled={saving}>
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
