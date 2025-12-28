import { useEffect, useMemo, useState } from "react";
import {
  periodosService,
  type PeriodoCreateDTO,
  type PeriodoUpdateDTO,
} from "../../services/periodos.service";
import type { PeriodoAcademico } from "../../types/periodoAcademico";

import { Eye, Pencil, ToggleLeft, ToggleRight, Plus, Search } from "lucide-react";
import "./PeriodosPage.css";

const PAGE_SIZE = 10;

const empty: PeriodoCreateDTO = {
  codigo_periodo: "",
  descripcion_periodo: "",
  fecha_inicio: "",
  fecha_fin: "",
};

const toBool = (estado: PeriodoAcademico["estado"]): boolean => {
  if (typeof estado === "boolean") return estado;
  return estado === 1;
};

/** Convierte cualquier fecha (Date | ISO | YYYY-MM-DD) a YYYY-MM-DD */
const toDateInput = (v: any): string => {
  if (!v) return "";

  // Si ya viene YYYY-MM-DD
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // Si viene ISO string
  if (typeof v === "string" && v.length >= 10) return v.slice(0, 10);

  // Si viene como Date (mysql2 puede devolver Date dependiendo config)
  try {
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    // OJO: usamos componentes locales para evitar offsets raros en UI
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
};

const fmtDate = (v: any) => {
  const s = toDateInput(v);
  if (!s) return "-";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

const normalizeCodigo = (input: string) => {
  let s = input.trim();
  s = s.replace(/\s+/g, "_");
  s = s.replace(/[^a-zA-Z0-9_]/g, "");
  return s.toUpperCase();
};

export default function PeriodosPage() {
  const [items, setItems] = useState<PeriodoAcademico[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  // filtro fechas (cliente)
  const [desde, setDesde] = useState(""); // fecha_inicio >= desde
  const [hasta, setHasta] = useState(""); // fecha_fin <= hasta

  // paginación
  const [page, setPage] = useState(1);

  // modales
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);

  const [editing, setEditing] = useState<PeriodoAcademico | null>(null);
  const [viewing, setViewing] = useState<PeriodoAcademico | null>(null);

  const [form, setForm] = useState<PeriodoCreateDTO>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await periodosService.list({
        includeInactive,
        q: q.trim() ? q.trim() : undefined,
      });

      // ✅ CLAVE: normalizamos fechas al cargar para evitar “fechas raras”
      const normalized = (data ?? []).map((p: any) => ({
        ...p,
        fecha_inicio: toDateInput(p.fecha_inicio),
        fecha_fin: toDateInput(p.fecha_fin),
        estado: typeof p.estado === "boolean" ? p.estado : Number(p.estado) === 1 ? 1 : 0,
      })) as PeriodoAcademico[];

      setItems(normalized);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  // ===== filtros aplicados
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();

    return (items ?? [])
      .filter((p) => (includeInactive ? true : toBool(p.estado)))
      .filter((p) => {
        if (!t) return true;
        const code = String(p.codigo_periodo ?? "").toLowerCase();
        const desc = String(p.descripcion_periodo ?? "").toLowerCase();
        return code.includes(t) || desc.includes(t);
      })
      .filter((p) => {
        if (!desde) return true;
        const ini = toDateInput(p.fecha_inicio);
        return ini ? ini >= desde : true;
      })
      .filter((p) => {
        if (!hasta) return true;
        const fin = toDateInput(p.fecha_fin);
        return fin ? fin <= hasta : true;
      })
      .sort((a, b) =>
        (toDateInput(b.fecha_inicio) ?? "").localeCompare(toDateInput(a.fecha_inicio) ?? "")
      );
  }, [items, q, includeInactive, desde, hasta]);

  useEffect(() => {
    setPage(1);
  }, [q, includeInactive, desde, hasta]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // ✅ Stats basadas en items ya normalizados
  const stats = useMemo(() => {
    const total = items?.length ?? 0;
    const activos = (items ?? []).filter((p) => toBool(p.estado)).length;
    const inactivos = total - activos;
    return { total, activos, inactivos };
  }, [items]);

  // ===== modales
  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setErrors({});
    setOpenForm(true);
  };

  const openEdit = (p: PeriodoAcademico) => {
    setEditing(p);
    setForm({
      codigo_periodo: p.codigo_periodo ?? "",
      descripcion_periodo: p.descripcion_periodo ?? "",
      fecha_inicio: toDateInput(p.fecha_inicio),
      fecha_fin: toDateInput(p.fecha_fin),
    });
    setErrors({});
    setOpenForm(true);
  };

  const openDetails = (p: PeriodoAcademico) => {
    setViewing(p);
    setOpenView(true);
  };

  const closeForm = () => setOpenForm(false);
  const closeView = () => setOpenView(false);

  const onChange = (k: keyof PeriodoCreateDTO, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // ===== validación
  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};

    const code = form.codigo_periodo?.trim();
    if (!code) e.codigo_periodo = "El código es obligatorio.";

    const desc = form.descripcion_periodo?.trim();
    if (!desc) e.descripcion_periodo = "La descripción es obligatoria.";

    const ini = toDateInput(form.fecha_inicio);
    const fin = toDateInput(form.fecha_fin);

    if (!ini) e.fecha_inicio = "La fecha inicio es obligatoria.";
    if (!fin) e.fecha_fin = "La fecha fin es obligatoria.";

    if (ini && fin && fin < ini) e.fecha_fin = "La fecha fin no puede ser menor que la fecha inicio.";

    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      const payload: PeriodoCreateDTO = {
        codigo_periodo: normalizeCodigo(form.codigo_periodo),
        descripcion_periodo: form.descripcion_periodo.trim(),
        fecha_inicio: toDateInput(form.fecha_inicio),
        fecha_fin: toDateInput(form.fecha_fin),
      };

      if (!editing) {
        await periodosService.create(payload);
      } else {
        const up: PeriodoUpdateDTO = { ...payload };
        await periodosService.update(editing.id_periodo, up);
      }

      setOpenForm(false);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err?.message ?? "Error al guardar el período.");
    }
  };

  const toggleEstado = async (p: PeriodoAcademico) => {
    try {
      await periodosService.toggleEstado(p.id_periodo, p.estado);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Error al cambiar estado.");
    }
  };

  return (
    <div className="periodos-wrap">
      {/* ✅ Panel superior tipo Carreras */}
      <div className="periodos-panel">
        <div className="panel-top">
          <div>
            <h2 className="panel-title">Períodos académicos</h2>
            <p className="panel-subtitle">Gestión de períodos (código, fechas y estado).</p>
          </div>

          <button className="btn-primary periodos-primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo período
          </button>
        </div>

        <div className="panel-mid">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total</div>
              <div className="stat-value">{stats.total}</div>
            </div>

            <div className="stat-card stat-card-success">
              <div className="stat-label">Activos</div>
              <div className="stat-value">{stats.activos}</div>
            </div>

            <div className="stat-card stat-card-danger">
              <div className="stat-label">Inactivos</div>
              <div className="stat-value">{stats.inactivos}</div>
            </div>
          </div>

          <div className="panel-actions">
            <label className="switch">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              <span className="switch-slider" />
              <span className="switch-label">Mostrar inactivos</span>
            </label>

            <button className="btn-secondary" onClick={load} disabled={loading}>
              {loading ? "Actualizando…" : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="filters-row">
          <div className="search-box">
            <Search size={16} />
            <input
              className="input-base"
              placeholder="Buscar por código o descripción…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="date-box">
            <span className="date-label">Desde</span>
            <input
              type="date"
              className="input-base"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>

          <div className="date-box">
            <span className="date-label">Hasta</span>
            <input
              type="date"
              className="input-base"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>

          <button
            className="btn-secondary"
            onClick={() => {
              setDesde("");
              setHasta("");
              setQ("");
            }}
            disabled={!q && !desde && !hasta}
            title="Limpiar filtros"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th className="th-actions">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="td-center">
                    Cargando…
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="td-center">
                    Sin datos
                  </td>
                </tr>
              ) : (
                pageItems.map((p) => {
                  const activo = toBool(p.estado);

                  return (
                    <tr key={p.id_periodo}>
                      <td className="td-strong">{p.codigo_periodo}</td>
                      <td className="td-muted">{p.descripcion_periodo}</td>
                      <td className="periodos-date">{fmtDate(p.fecha_inicio)}</td>
                      <td className="periodos-date">{fmtDate(p.fecha_fin)}</td>

                      <td>
                        <span className={`badge ${activo ? "active" : "inactive"}`}>
                          {activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-table-btn icon-view"
                            title="Ver"
                            onClick={() => openDetails(p)}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            className="icon-table-btn icon-edit"
                            title="Editar"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className={`icon-table-btn ${activo ? "icon-danger" : "icon-success"}`}
                            title={activo ? "Desactivar" : "Activar"}
                            onClick={() => toggleEstado(p)}
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

        {/* ✅ Paginación centrada */}
        <div className="pagination-bar">
          <button
            className="btn-secondary"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>

          <span className="pagination-text">
            Página <b>{page}</b> de <b>{totalPages}</b>
          </span>

          <button
            className="btn-secondary"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Modal formulario */}
      {openForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 className="modal-title">{editing ? "Editar período" : "Nuevo período"}</h3>
                <p className="modal-subtitle">Configura datos del período académico.</p>
              </div>
              <button className="icon-btn" onClick={closeForm} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="modal-form">
              <div className="modal-grid">
                <div>
                  <label className="form-label">Código *</label>
                  <input
                    className={`input-base ${errors.codigo_periodo ? "input-error" : ""}`}
                    value={form.codigo_periodo}
                    onChange={(e) => onChange("codigo_periodo", e.target.value)}
                    onBlur={(e) => onChange("codigo_periodo", normalizeCodigo(e.target.value))}
                    placeholder="Ej: 2025-A"
                  />
                  {errors.codigo_periodo && <div className="field-error">{errors.codigo_periodo}</div>}
                </div>

                <div>
                  <label className="form-label">Descripción *</label>
                  <input
                    className={`input-base ${errors.descripcion_periodo ? "input-error" : ""}`}
                    value={form.descripcion_periodo}
                    onChange={(e) => onChange("descripcion_periodo", e.target.value)}
                    placeholder="Ej: Periodo ordinario 2025-A"
                  />
                  {errors.descripcion_periodo && <div className="field-error">{errors.descripcion_periodo}</div>}
                </div>

                <div>
                  <label className="form-label">Fecha inicio *</label>
                  <input
                    type="date"
                    className={`input-base ${errors.fecha_inicio ? "input-error" : ""}`}
                    value={toDateInput(form.fecha_inicio)}
                    onChange={(e) => onChange("fecha_inicio", e.target.value)}
                  />
                  {errors.fecha_inicio && <div className="field-error">{errors.fecha_inicio}</div>}
                </div>

                <div>
                  <label className="form-label">Fecha fin *</label>
                  <input
                    type="date"
                    className={`input-base ${errors.fecha_fin ? "input-error" : ""}`}
                    value={toDateInput(form.fecha_fin)}
                    onChange={(e) => onChange("fecha_fin", e.target.value)}
                  />
                  {errors.fecha_fin && <div className="field-error">{errors.fecha_fin}</div>}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeForm}>
                  Cancelar
                </button>
                <button className="btn-primary periodos-primary" onClick={submit}>
                  {editing ? "Guardar cambios" : "Crear período"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal ver detalle */}
      {openView && viewing && (
        <div className="modal-backdrop" onClick={closeView}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 className="modal-title">Detalle del período</h3>
                <p className="modal-subtitle">Información registrada en el sistema.</p>
              </div>
              <button className="icon-btn" onClick={closeView} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Código</span>
                <span className="detail-value">{viewing.codigo_periodo}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Descripción</span>
                <span className="detail-value">{viewing.descripcion_periodo}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Inicio</span>
                <span className="detail-value">{fmtDate(viewing.fecha_inicio)}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Fin</span>
                <span className="detail-value">{fmtDate(viewing.fecha_fin)}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Estado</span>
                <span className="detail-value">
                  <span className={`badge ${toBool(viewing.estado) ? "active" : "inactive"}`}>
                    {toBool(viewing.estado) ? "Activo" : "Inactivo"}
                  </span>
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeView}>
                Cerrar
              </button>
              <button
                className="btn-primary periodos-primary"
                onClick={() => {
                  closeView();
                  openEdit(viewing);
                }}
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
