import { useEffect, useMemo, useState, type FormEvent } from "react";
import "./CarreraPeriodoPage.css";

import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { Carrera } from "../../types/carrera";
import type { PeriodoAcademico } from "../../types/periodoAcademico";

import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { carrerasService } from "../../services/carreras.service";
import { periodosService } from "../../services/periodos.service";

type FormState = {
  id_carrera: string;
  id_periodo: string;
};

const isActive = (estado: boolean | number) =>
  typeof estado === "boolean" ? estado : estado === 1;

const toYMD = (v: any) => (v ? String(v).slice(0, 10) : "");

const periodoLabel = (p: any) => {
  const codigo = p.codigo_periodo ?? "";
  const desc = p.descripcion_periodo ?? "";
  const fi = toYMD(p.fecha_inicio);
  const ff = toYMD(p.fecha_fin);

  const base = [codigo, desc].filter(Boolean).join(" · ");
  const rango = fi && ff ? ` (${fi} → ${ff})` : "";
  return (base || `Período #${p.id_periodo}`) + rango;
};

export default function CarreraPeriodoPage() {
  const [items, setItems] = useState<CarreraPeriodo[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros estilo Carreras
  const [q, setQ] = useState("");
  const [filterCarreraId, setFilterCarreraId] = useState<string>("");
  const [filterPeriodoId, setFilterPeriodoId] = useState<string>("");
  const [includeInactive, setIncludeInactive] = useState(false);

  // paginación
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  // modales
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);

  const [editing, setEditing] = useState<CarreraPeriodo | null>(null);
  const [viewing, setViewing] = useState<CarreraPeriodo | null>(null);

  const [form, setForm] = useState<FormState>({ id_carrera: "", id_periodo: "" });

  const carreraName = useMemo(() => {
    const map = new Map<number, string>();
    carreras.forEach((c) => map.set(c.id_carrera, c.nombre_carrera));
    return map;
  }, [carreras]);

  const periodoName = useMemo(() => {
    const map = new Map<number, string>();
    (periodos as any[]).forEach((p) => map.set(p.id_periodo, periodoLabel(p)));
    return map;
  }, [periodos]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cs, ps] = await Promise.all([
        carrerasService.list(),
        periodosService.list(),
      ]);
      setCarreras(cs ?? []);
      setPeriodos(ps ?? []);
    } finally {
      setLoading(false);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const cp = await carreraPeriodoService.list({
        includeInactive,
        carreraId: filterCarreraId ? Number(filterCarreraId) : null,
        periodoId: filterPeriodoId ? Number(filterPeriodoId) : null,
        q,
      });
      setItems(cp ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    // al cambiar filtros, vuelve a página 1
    setPage(1);
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive, filterCarreraId, filterPeriodoId, q]);

  const total = items.length;
  const totalActivos = items.filter((x) => isActive(x.estado)).length;
  const totalInactivos = total - totalActivos;

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const openCreate = () => {
    setEditing(null);
    setForm({ id_carrera: "", id_periodo: "" });
    setOpenForm(true);
  };

  const openEdit = (x: CarreraPeriodo) => {
    setEditing(x);
    setForm({ id_carrera: String(x.id_carrera), id_periodo: String(x.id_periodo) });
    setOpenForm(true);
  };

  const closeForm = () => {
    setOpenForm(false);
    setEditing(null);
  };

  const openDetails = (x: CarreraPeriodo) => {
    setViewing(x);
    setOpenView(true);
  };

  const closeView = () => {
    setOpenView(false);
    setViewing(null);
  };

  const validate = () => {
    if (!form.id_carrera) return "Selecciona una carrera.";
    if (!form.id_periodo) return "Selecciona un período.";
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    setLoading(true);
    try {
      const payload = {
        id_carrera: Number(form.id_carrera),
        id_periodo: Number(form.id_periodo),
      };

      if (editing) {
        await carreraPeriodoService.update(editing.id_carrera_periodo, payload);
      } else {
        await carreraPeriodoService.create(payload);
      }

      await fetchList();
      closeForm();
    } catch (e) {
      alert("No se pudo guardar Carrera–Período. Revisa backend/console.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (x: CarreraPeriodo) => {
    const cn = (x as any).nombre_carrera ?? carreraName.get(x.id_carrera) ?? "Carrera";
    const pn =
      (x as any).codigo_periodo
        ? `${(x as any).codigo_periodo} (${toYMD((x as any).fecha_inicio)} → ${toYMD((x as any).fecha_fin)})`
        : periodoName.get(x.id_periodo) ?? "Período";

    const action = isActive(x.estado) ? "desactivar" : "activar";
    if (!confirm(`¿Seguro que deseas ${action} "${cn} – ${pn}"?`)) return;

    const currentEstado: 0 | 1 = isActive(x.estado) ? 1 : 0;

    setLoading(true);
    try {
      await carreraPeriodoService.toggleEstado(x.id_carrera_periodo, currentEstado);
      await fetchList();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-wrap">
      {/* PANEL SUPERIOR (estilo Carreras) */}
      <div className="cp-panel">
        <div className="cp-panel-top">
          <div>
            <h1 className="cp-title">Carrera – Período</h1>
            <p className="cp-subtitle">Asignación oficial de carreras para un período académico.</p>
          </div>

          <button onClick={openCreate} className="btn-primary">
            + Nuevo
          </button>
        </div>

        <div className="cp-stats">
          <div className="stat-chip">
            <span>Total</span>
            <b>{total}</b>
          </div>
          <div className="stat-chip ok">
            <span>Activos</span>
            <b>{totalActivos}</b>
          </div>
          <div className="stat-chip bad">
            <span>Inactivos</span>
            <b>{totalInactivos}</b>
          </div>
        </div>

        <div className="cp-filters">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por carrera o período…"
            className="input-base"
          />

          <select
            value={filterCarreraId}
            onChange={(e) => setFilterCarreraId(e.target.value)}
            className="input-base"
          >
            <option value="">Todas las carreras</option>
            {carreras.map((c) => (
              <option key={c.id_carrera} value={c.id_carrera}>
                {c.nombre_carrera} ({c.modalidad} · {c.sede})
              </option>
            ))}
          </select>

          <select
            value={filterPeriodoId}
            onChange={(e) => setFilterPeriodoId(e.target.value)}
            className="input-base"
          >
            <option value="">Todos los períodos</option>
            {(periodos as any[]).map((p) => (
              <option key={p.id_periodo} value={p.id_periodo}>
                {periodoLabel(p)}
              </option>
            ))}
          </select>

          <label className="switch">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            <span className="slider" />
            <span className="switch-text">Mostrar inactivas</span>
          </label>
        </div>
      </div>

      {/* TABLA */}
      <div className="cp-card">
        <div className="cp-table-scroll">
          <table className="cp-table">
            <thead>
              <tr>
                <th>Carrera</th>
                <th>Período</th>
                <th>Estado</th>
                <th className="cp-actions-col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="cp-td-center">
                    Cargando…
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={4} className="cp-td-center">
                    Sin datos
                  </td>
                </tr>
              ) : (
                paged.map((x) => {
                  const cn = (x as any).nombre_carrera ?? carreraName.get(x.id_carrera) ?? "—";
                  const pn =
                    (x as any).codigo_periodo
                      ? `${(x as any).codigo_periodo} (${toYMD((x as any).fecha_inicio)} → ${toYMD((x as any).fecha_fin)})`
                      : periodoName.get(x.id_periodo) ?? "—";

                  const activo = isActive(x.estado);

                  return (
                    <tr key={x.id_carrera_periodo}>
                      <td className="cp-td-strong">{cn}</td>
                      <td className="cp-td-muted">{pn}</td>
                      <td>
                        <span className={`badge ${activo ? "active" : "inactive"}`}>
                          {activo ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => openDetails(x)} className="icon-action view">
                            Ver
                          </button>
                          <button onClick={() => openEdit(x)} className="icon-action edit">
                            Editar
                          </button>
                          <button
                            onClick={() => toggleEstado(x)}
                            className={`icon-action ${activo ? "off" : "on"}`}
                          >
                            {activo ? "Desactivar" : "Activar"}
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

        {/* PAGINACIÓN (centrada) */}
        <div className="cp-pagination">
          <button
            className="btn-page"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ◀
          </button>

          <span className="page-info">
            Página <b>{page}</b> de <b>{pageCount}</b>
          </span>

          <button
            className="btn-page"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
          >
            ▶
          </button>
        </div>
      </div>

      {/* MODAL FORM */}
      {openForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2 className="modal-title">{editing ? "Editar asignación" : "Nueva asignación"}</h2>
                <p className="modal-subtitle">Selecciona una carrera y un período.</p>
              </div>
              <button className="icon-btn" onClick={closeForm} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="modal-body">
              <div className="form-grid">
                <div>
                  <label className="form-label">Carrera</label>
                  <select
                    value={form.id_carrera}
                    onChange={(e) => setForm((p) => ({ ...p, id_carrera: e.target.value }))}
                    className="input-base"
                  >
                    <option value="">Seleccione…</option>
                    {carreras.map((c) => (
                      <option key={c.id_carrera} value={c.id_carrera}>
                        {c.nombre_carrera} ({c.modalidad} · {c.sede})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Período</label>
                  <select
                    value={form.id_periodo}
                    onChange={(e) => setForm((p) => ({ ...p, id_periodo: e.target.value }))}
                    className="input-base"
                  >
                    <option value="">Seleccione…</option>
                    {(periodos as any[]).map((p) => (
                      <option key={p.id_periodo} value={p.id_periodo}>
                        {periodoLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {editing ? "Guardar cambios" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER */}
      {openView && viewing && (
        <div className="modal-backdrop" onClick={closeView}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2 className="modal-title">Detalle de asignación</h2>
                <p className="modal-subtitle">Información de Carrera–Período.</p>
              </div>
              <button className="icon-btn" onClick={closeView} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="view-grid">
                <div className="view-row">
                  <span className="view-label">Carrera</span>
                  <span className="view-value">
                    {(viewing as any).nombre_carrera ?? carreraName.get(viewing.id_carrera) ?? "—"}
                  </span>
                </div>

                <div className="view-row">
                  <span className="view-label">Período</span>
                  <span className="view-value">
                    {(viewing as any).codigo_periodo
                      ? `${(viewing as any).codigo_periodo} (${toYMD((viewing as any).fecha_inicio)} → ${toYMD(
                          (viewing as any).fecha_fin
                        )})`
                      : periodoName.get(viewing.id_periodo) ?? "—"}
                  </span>
                </div>

                <div className="view-row">
                  <span className="view-label">Estado</span>
                  <span className="view-value">
                    {isActive(viewing.estado) ? "ACTIVO" : "INACTIVO"}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={closeView} className="btn-secondary">
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    closeView();
                    openEdit(viewing);
                  }}
                  className="btn-primary"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
