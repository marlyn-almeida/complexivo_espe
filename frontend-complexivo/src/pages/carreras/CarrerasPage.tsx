import { useEffect, useMemo, useState, type FormEvent } from "react";
import "./CarrerasPage.css";

import type { Carrera, Estado01 } from "../../types/carrera";
import { carrerasService } from "../../services/carreras.service";

type CarreraForm = {
  nombre_carrera: string;
  sede: string;
  modalidad: string;
};

const isActive = (estado: Estado01 | boolean) =>
  typeof estado === "boolean" ? estado : estado === 1;

const to01 = (estado: Estado01 | boolean): Estado01 =>
  typeof estado === "boolean" ? (estado ? 1 : 0) : estado;

export default function CarrerasPage() {
  const [items, setItems] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Carrera | null>(null);
  const [form, setForm] = useState<CarreraForm>({
    nombre_carrera: "",
    sede: "",
    modalidad: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await carrerasService.list();
      setItems(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;

    return items.filter((c) => {
      const a = (c.nombre_carrera ?? "").toLowerCase();
      const b = (c.sede ?? "").toLowerCase();
      const d = (c.modalidad ?? "").toLowerCase();
      return a.includes(query) || b.includes(query) || d.includes(query);
    });
  }, [items, q]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre_carrera: "", sede: "", modalidad: "" });
    setOpen(true);
  };

  const openEdit = (c: Carrera) => {
    setEditing(c);
    setForm({
      nombre_carrera: c.nombre_carrera ?? "",
      sede: c.sede ?? "",
      modalidad: c.modalidad ?? "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const validate = (): string | null => {
    if (!form.nombre_carrera.trim()) return "Ingresa el nombre de la carrera.";
    if (!form.sede.trim()) return "Ingresa la sede.";
    if (!form.modalidad.trim()) return "Ingresa la modalidad.";
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    setLoading(true);
    try {
      if (editing) {
        await carrerasService.update(editing.id_carrera, {
          nombre_carrera: form.nombre_carrera.trim(),
          sede: form.sede.trim(),
          modalidad: form.modalidad.trim(),
        });
      } else {
        await carrerasService.create({
          nombre_carrera: form.nombre_carrera.trim(),
          sede: form.sede.trim(),
          modalidad: form.modalidad.trim(),
        });
      }

      await load();
      closeModal();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "No se pudo guardar la carrera.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (c: Carrera) => {
    const action = isActive(c.estado) ? "desactivar" : "activar";
    if (!confirm(`¿Seguro que deseas ${action} la carrera "${c.nombre_carrera}"?`)) return;

    const currentEstado: Estado01 = to01(c.estado);

    setLoading(true);
    try {
      await carrerasService.toggleEstado(c.id_carrera, currentEstado);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Error al cambiar estado.");
    } finally {
      setLoading(false);
    }
  };

  const totalActivos = filtered.filter((c) => isActive(c.estado)).length;
  const totalInactivos = filtered.length - totalActivos;

  return (
    <div className="carreras-wrap">
      <div className="carreras-header">
        <div className="carreras-title">
          <h1>Carreras</h1>
          <p>Administra las carreras, sede, modalidad y su estado.</p>
        </div>

        <div className="carreras-actions">
          <input
            className="input-base carreras-search"
            placeholder="Buscar por nombre, sede o modalidad…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-primary" onClick={openCreate}>
            + Nueva
          </button>
        </div>
      </div>

      <div className="carreras-card">
        <div className="carreras-card-head">
          <div className="carreras-meta">
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
          <span className="carreras-hint">Tip: desactiva en lugar de eliminar.</span>
        </div>

        <div className="carreras-table-scroll">
          <table className="carreras-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Sede</th>
                <th>Modalidad</th>
                <th>Estado</th>
                <th className="carreras-actions-col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="td-center">
                    Cargando…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="td-center">
                    Sin datos
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const activo = isActive(c.estado);
                  return (
                    <tr key={c.id_carrera}>
                      <td className="td-strong">{c.nombre_carrera}</td>
                      <td className="td-muted">{c.sede}</td>
                      <td className="td-muted">{c.modalidad}</td>
                      <td>
                        <span className={`badge ${activo ? "active" : "inactive"}`}>
                          {activo ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="table-btn" onClick={() => openEdit(c)}>
                            Editar
                          </button>
                          <button
                            className={`table-btn ${activo ? "danger" : "success"}`}
                            onClick={() => toggleEstado(c)}
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
                <h2 className="modal-title">{editing ? "Editar carrera" : "Nueva carrera"}</h2>
                <p className="modal-subtitle">Completa los datos obligatorios.</p>
              </div>

              <button className="icon-btn" type="button" onClick={closeModal} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form className="modal-body" onSubmit={onSubmit}>
              <div className="form-grid">
                <div>
                  <label className="form-label">Nombre</label>
                  <input
                    className="input-base"
                    value={form.nombre_carrera}
                    onChange={(e) => setForm((p) => ({ ...p, nombre_carrera: e.target.value }))}
                    placeholder="Ej. Tecnologías de la Información"
                  />
                </div>

                <div>
                  <label className="form-label">Sede</label>
                  <input
                    className="input-base"
                    value={form.sede}
                    onChange={(e) => setForm((p) => ({ ...p, sede: e.target.value }))}
                    placeholder="Ej. Sangolquí"
                  />
                </div>

                <div>
                  <label className="form-label">Modalidad</label>
                  <input
                    className="input-base"
                    value={form.modalidad}
                    onChange={(e) => setForm((p) => ({ ...p, modalidad: e.target.value }))}
                    placeholder="Ej. En línea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
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
