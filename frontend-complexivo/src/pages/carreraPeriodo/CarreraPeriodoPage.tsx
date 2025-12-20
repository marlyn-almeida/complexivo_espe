import { useEffect, useMemo, useState, type FormEvent } from "react";
import "./CarreraPeriodoPage.css";

import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { Carrera } from "../../types/carrera";
import type { PeriodoAcademico } from "../../types/periodoAcademico";

import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { carrerasService } from "../../services/carreras.service";
import { periodosService } from "../../services/periodos.service";

type FormState = {
  id_carrera: string; // string por <select>
  id_periodo: string;
};

const isActive = (estado: boolean | number) =>
  typeof estado === "boolean" ? estado : estado === 1;

const periodoLabel = (p: PeriodoAcademico) => {
  const codigo = (p as any).codigo_periodo ?? "";
  const desc = (p as any).descripcion_periodo ?? "";
  const fi = (p as any).fecha_inicio ?? "";
  const ff = (p as any).fecha_fin ?? "";

  const base = [codigo, desc].filter(Boolean).join(" · ");
  const rango =
    fi && ff ? ` (${String(fi).slice(0, 10)} → ${String(ff).slice(0, 10)})` : "";
  return (base || `Período #${(p as any).id_periodo}`) + rango;
};

export default function CarreraPeriodoPage() {
  const [items, setItems] = useState<CarreraPeriodo[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CarreraPeriodo | null>(null);
  const [form, setForm] = useState<FormState>({ id_carrera: "", id_periodo: "" });

  const carreraName = useMemo(() => {
    const map = new Map<number, string>();
    carreras.forEach((c) => map.set(c.id_carrera, c.nombre_carrera));
    return map;
  }, [carreras]);

  const periodoName = useMemo(() => {
    const map = new Map<number, string>();
    periodos.forEach((p) => {
      const label = (p as any).codigo_periodo ? String((p as any).codigo_periodo) : periodoLabel(p);
      map.set((p as any).id_periodo, label);
    });
    return map;
  }, [periodos]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cp, cs, ps] = await Promise.all([
        carreraPeriodoService.list(),
        carrerasService.list(),
        periodosService.list(),
      ]);
      setItems(cp ?? []);
      setCarreras(cs ?? []);
      setPeriodos(ps ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;

    return items.filter((x) => {
      const cn = (x.carrera_nombre ?? carreraName.get(x.id_carrera) ?? "").toLowerCase();
      const pn = (x.periodo_nombre ?? periodoName.get(x.id_periodo) ?? "").toLowerCase();
      return cn.includes(query) || pn.includes(query);
    });
  }, [items, q, carreraName, periodoName]);

  const openCreate = () => {
    setEditing(null);
    setForm({ id_carrera: "", id_periodo: "" });
    setOpen(true);
  };

  const openEdit = (x: CarreraPeriodo) => {
    setEditing(x);
    setForm({ id_carrera: String(x.id_carrera), id_periodo: String(x.id_periodo) });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
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

      await fetchAll();
      closeModal();
    } catch {
      alert("No se pudo guardar Carrera–Período. Revisa consola/servidor.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (x: CarreraPeriodo) => {
    const cn = x.carrera_nombre ?? carreraName.get(x.id_carrera) ?? "Carrera";
    const pn = x.periodo_nombre ?? periodoName.get(x.id_periodo) ?? "Período";
    const action = isActive(x.estado) ? "desactivar" : "activar";

    if (!confirm(`¿Seguro que deseas ${action} "${cn} – ${pn}"?`)) return;

    // ✅ FIX: tu service pide (id, currentEstado)
    const currentEstado: 0 | 1 = isActive(x.estado) ? 1 : 0;

    setLoading(true);
    try {
      await carreraPeriodoService.toggleEstado(x.id_carrera_periodo, currentEstado);
      await fetchAll();
    } finally {
      setLoading(false);
    }
  };

  const totalActivos = filtered.filter((x) => isActive(x.estado)).length;
  const totalInactivos = filtered.length - totalActivos;

  return (
    <div className="cp-wrap">
      <div className="cp-header">
        <div className="cp-title">
          <h1>Carrera – Período</h1>
          <p>Asignación oficial de carreras para un período académico.</p>
        </div>

        <div className="cp-actions">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por carrera o período…"
            className="input-base cp-search"
          />
          <button onClick={openCreate} className="btn-primary">
            + Nuevo
          </button>
        </div>
      </div>

      <div className="cp-card">
        <div className="cp-card-head">
          <div className="cp-meta">
            <span className="meta-chip">
              Total: <b>{filtered.length}</b>
            </span>
            <span className="meta-chip">
              Activos: <b>{totalActivos}</b>
            </span>
            <span className="meta-chip">
              Inactivos: <b>{totalInactivos}</b>
            </span>
          </div>
          <span className="cp-hint">Tip: desactiva una asignación en vez de eliminar.</span>
        </div>

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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="cp-td-center">
                    Sin datos
                  </td>
                </tr>
              ) : (
                filtered.map((x) => {
                  const cn = x.carrera_nombre ?? carreraName.get(x.id_carrera) ?? "—";
                  const pn = x.periodo_nombre ?? periodoName.get(x.id_periodo) ?? "—";
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
                          <button onClick={() => openEdit(x)} className="table-btn">
                            Editar
                          </button>
                          <button
                            onClick={() => toggleEstado(x)}
                            className={`table-btn ${activo ? "danger" : "success"}`}
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
      </div>

      {open && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2 className="modal-title">{editing ? "Editar asignación" : "Nueva asignación"}</h2>
                <p className="modal-subtitle">Selecciona una carrera y un período.</p>
              </div>
              <button className="icon-btn" onClick={closeModal} aria-label="Cerrar">
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
                    {periodos.map((p: any) => (
                      <option key={p.id_periodo} value={p.id_periodo}>
                        {periodoLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-secondary">
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
    </div>
  );
}
