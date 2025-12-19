import { useEffect, useMemo, useState } from "react";
import "./CarrerasPage.css";

import { carrerasService, type CarreraCreateDTO, type CarreraUpdateDTO } from "../../services/carreras.service";
import type { Carrera } from "../../types/carrera";

const empty: CarreraCreateDTO = {
  nombre_carrera: "",
  sede: "",
  modalidad: "EN_LINEA", // valor por defecto (ajústalo si tu backend usa otro)
};

const isActive = (estado: Carrera["estado"]) => {
  if (typeof estado === "boolean") return estado;
  return estado === 1;
};

export default function CarrerasPage() {
  const [items, setItems] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Carrera | null>(null);
  const [form, setForm] = useState<CarreraCreateDTO>(empty);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;

    return items.filter((c) => {
      const nombre = (c.nombre_carrera ?? "").toLowerCase();
      const sede = (c.sede ?? "").toLowerCase();
      const modalidad = (c.modalidad ?? "").toLowerCase();
      return nombre.includes(t) || sede.includes(t) || modalidad.includes(t);
    });
  }, [items, q]);

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

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (c: Carrera) => {
    setEditing(c);
    setForm({
      nombre_carrera: c.nombre_carrera ?? "",
      sede: c.sede ?? "",
      modalidad: c.modalidad ?? "EN_LINEA",
    });
    setOpen(true);
  };

  const close = () => setOpen(false);

  const onChange = (k: keyof CarreraCreateDTO, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.nombre_carrera || !form.sede || !form.modalidad) {
      alert("Completa todos los campos de la carrera.");
      return;
    }

    try {
      if (!editing) {
        await carrerasService.create(form);
      } else {
        const payload: CarreraUpdateDTO = { ...form };
        await carrerasService.update(editing.id_carrera, payload);
      }

      setOpen(false);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Error al guardar la carrera.");
    }
  };

  const toggleEstado = async (c: Carrera) => {
    try {
      await carrerasService.toggleEstado(c.id_carrera, c.estado);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Error al cambiar estado.");
    }
  };

  const totalActivos = filtered.filter((c) => isActive(c.estado)).length;
  const totalInactivos = filtered.length - totalActivos;

  return (
    <div className="carreras-wrap">
      <div className="carreras-header">
        <div className="carreras-title">
          <h1>Carreras</h1>
          <p>Administra carreras, sede y modalidad para el examen complexivo.</p>
        </div>

        <div className="carreras-actions">
          <input
            className="input-base carreras-search"
            placeholder="Buscar por nombre, sede o modalidad…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <button className="btn-secondary" onClick={load} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>

          <button className="btn-primary" onClick={openCreate}>
            + Nueva carrera
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

          <span className="carreras-hint">Tip: desactiva en vez de eliminar.</span>
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
                  <td colSpan={5} className="carreras-td-center">
                    Cargando…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="carreras-td-center">
                    Sin datos
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const activo = isActive(c.estado);
                  return (
                    <tr key={c.id_carrera}>
                      <td className="carreras-td-strong">{c.nombre_carrera}</td>
                      <td className="carreras-td-muted">{c.sede}</td>
                      <td className="carreras-td-muted">{c.modalidad}</td>
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
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 className="modal-title">{editing ? "Editar carrera" : "Nueva carrera"}</h3>
                <p className="modal-subtitle">Completa la información de la carrera.</p>
              </div>
              <button className="icon-btn" onClick={close} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div>
                  <label className="form-label">Nombre</label>
                  <input
                    className="input-base"
                    value={form.nombre_carrera}
                    onChange={(e) => onChange("nombre_carrera", e.target.value)}
                    placeholder="Ej: Tecnologías de la Información"
                  />
                </div>

                <div>
                  <label className="form-label">Sede</label>
                  <input
                    className="input-base"
                    value={form.sede}
                    onChange={(e) => onChange("sede", e.target.value)}
                    placeholder="Ej: Matriz / Sangolquí"
                  />
                </div>

                <div>
                  <label className="form-label">Modalidad</label>
                  <select
                    className="input-base"
                    value={form.modalidad}
                    onChange={(e) => onChange("modalidad", e.target.value)}
                  >
                    {/* Ajusta estos valores a lo que tu backend use */}
                    <option value="EN_LINEA">En línea</option>
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="HIBRIDA">Híbrida</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={close}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={submit}>
                  {editing ? "Guardar cambios" : "Crear carrera"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
