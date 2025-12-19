import { useEffect, useMemo, useState } from "react";
import {
  periodosService,
  type PeriodoCreateDTO,
  type PeriodoUpdateDTO,
} from "../../services/periodos.service";
import type { PeriodoAcademico } from "../../types/periodoAcademico";
import "./PeriodosPage.css";

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

const fmt = (iso: string) => {
  try {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
};

export default function PeriodosPage() {
  const [items, setItems] = useState<PeriodoAcademico[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);

  const [editing, setEditing] = useState<PeriodoAcademico | null>(null);
  const [viewing, setViewing] = useState<PeriodoAcademico | null>(null);

  const [form, setForm] = useState<PeriodoCreateDTO>(empty);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;

    return items.filter((p) => {
      const code = (p.codigo_periodo ?? "").toLowerCase();
      const desc = (p.descripcion_periodo ?? "").toLowerCase();
      return code.includes(t) || desc.includes(t);
    });
  }, [items, q]);

  const load = async () => {
    setLoading(true);
    try {
      // ✅ Aprovecha query del backend (no solo filtrar en memoria)
      const data = await periodosService.list({
        includeInactive,
        q: q.trim() ? q.trim() : undefined,
      });
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  // si quieres que busque “en vivo”, descomenta:
  // useEffect(() => {
  //   const t = setTimeout(() => load(), 350);
  //   return () => clearTimeout(t);
  // }, [q]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpenForm(true);
  };

  const openEdit = (p: PeriodoAcademico) => {
    setEditing(p);
    setForm({
      codigo_periodo: p.codigo_periodo ?? "",
      descripcion_periodo: p.descripcion_periodo ?? "",
      fecha_inicio: p.fecha_inicio?.slice(0, 10) ?? "",
      fecha_fin: p.fecha_fin?.slice(0, 10) ?? "",
    });
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

  const submit = async () => {
    if (!form.codigo_periodo || !form.descripcion_periodo || !form.fecha_inicio || !form.fecha_fin) {
      alert("Completa todos los campos del período.");
      return;
    }

    try {
      if (!editing) {
        await periodosService.create(form);
      } else {
        const payload: PeriodoUpdateDTO = { ...form };
        await periodosService.update(editing.id_periodo, payload);
      }
      setOpenForm(false);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Error al guardar el período.");
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
    <div className="page-wrap">
      <div className="page-header">
        <div className="page-title-block">
          <h2 className="page-title">Períodos</h2>
          <p className="page-subtitle">Convocatorias y períodos académicos.</p>
        </div>

        <div className="page-actions">
          <div className="filters">
            <input
              className="input-base search-input"
              placeholder="Buscar por código o descripción…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

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

            <button className="btn-primary" onClick={openCreate}>
              + Nuevo período
            </button>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-meta">
          <div className="meta-left">
            <span className="meta-chip">
              Total: <b>{filtered.length}</b>
            </span>
            <span className="meta-chip">
              Activos:{" "}
              <b>{filtered.filter((p) => toBool(p.estado)).length}</b>
            </span>
            <span className="meta-chip">
              Inactivos:{" "}
              <b>{filtered.filter((p) => !toBool(p.estado)).length}</b>
            </span>
          </div>

          <div className="meta-right">
            <span className="hint">Tip: usa “Cerrar” para desactivar, no se elimina.</span>
          </div>
        </div>

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
                  <td colSpan={6} className="td-center">Cargando…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="td-center">Sin datos</td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const activo = toBool(p.estado);
                  return (
                    <tr key={p.id_periodo}>
                      <td className="td-strong">{p.codigo_periodo}</td>
                      <td className="td-muted">{p.descripcion_periodo}</td>
                      <td className="periodos-date">{fmt(p.fecha_inicio)}</td>
                      <td className="periodos-date">{fmt(p.fecha_fin)}</td>
                      <td>
                        <span className={`badge ${activo ? "active" : "inactive"}`}>
                          {activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button className="table-btn" onClick={() => openDetails(p)}>
                            Ver
                          </button>
                          <button className="table-btn" onClick={() => openEdit(p)}>
                            Editar
                          </button>
                          <button
                            className={`table-btn ${activo ? "danger" : "success"}`}
                            onClick={() => toggleEstado(p)}
                          >
                            {activo ? "Cerrar" : "Activar"}
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

      {/* Modal formulario */}
      {openForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 className="modal-title">{editing ? "Editar período" : "Nuevo período"}</h3>
                <p className="modal-subtitle">Configura datos del período académico.</p>
              </div>
              <button className="icon-btn" onClick={closeForm} aria-label="Cerrar">✕</button>
            </div>

            <div className="modal-form">
              <div className="modal-grid">
                <div>
                  <label className="form-label">Código</label>
                  <input
                    className="input-base"
                    value={form.codigo_periodo}
                    onChange={(e) => onChange("codigo_periodo", e.target.value)}
                    placeholder="Ej: 2025-A"
                  />
                </div>

                <div>
                  <label className="form-label">Descripción</label>
                  <input
                    className="input-base"
                    value={form.descripcion_periodo}
                    onChange={(e) => onChange("descripcion_periodo", e.target.value)}
                    placeholder="Ej: Periodo ordinario 2025-A"
                  />
                </div>

                <div>
                  <label className="form-label">Fecha inicio</label>
                  <input
                    type="date"
                    className="input-base"
                    value={form.fecha_inicio}
                    onChange={(e) => onChange("fecha_inicio", e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Fecha fin</label>
                  <input
                    type="date"
                    className="input-base"
                    value={form.fecha_fin}
                    onChange={(e) => onChange("fecha_fin", e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeForm}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={submit}>
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
              <button className="icon-btn" onClick={closeView} aria-label="Cerrar">✕</button>
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
                <span className="detail-value">{fmt(viewing.fecha_inicio)}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Fin</span>
                <span className="detail-value">{fmt(viewing.fecha_fin)}</span>
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
              <button className="btn-secondary" onClick={closeView}>Cerrar</button>
              <button className="btn-primary" onClick={() => { closeView(); openEdit(viewing); }}>
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
