import { useEffect, useMemo, useState, type FormEvent } from "react";
import "./DocentesPage.css";

import type { Docente } from "../../types/docente";
import { docentesService, type DocenteCreateDTO, type DocenteUpdateDTO } from "../../services/docentes.service";

type Estado01 = 0 | 1;

type DocenteForm = {
  id_institucional_docente: string;
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;
  correo_docente: string;
  telefono_docente: string;
  nombre_usuario: string;
};

const to01 = (estado: boolean | number | Estado01): Estado01 => {
  if (typeof estado === "boolean") return estado ? 1 : 0;
  return Number(estado) === 1 ? 1 : 0;
};

const isActive = (estado: boolean | number | Estado01) => to01(estado) === 1;

export default function DocentesPage() {
  const [items, setItems] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Docente | null>(null);

  const [form, setForm] = useState<DocenteForm>({
    id_institucional_docente: "",
    cedula: "",
    nombres_docente: "",
    apellidos_docente: "",
    correo_docente: "",
    telefono_docente: "",
    nombre_usuario: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await docentesService.list();
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

    return items.filter((d) => {
      const inst = (d.id_institucional_docente ?? "").toLowerCase();
      const ced = (d.cedula ?? "").toLowerCase();
      const nom = (d.nombres_docente ?? "").toLowerCase();
      const ape = (d.apellidos_docente ?? "").toLowerCase();
      const cor = (d.correo_docente ?? "").toLowerCase();
      const tel = (d.telefono_docente ?? "").toLowerCase();
      const user = (d.nombre_usuario ?? "").toLowerCase();

      return (
        inst.includes(query) ||
        ced.includes(query) ||
        nom.includes(query) ||
        ape.includes(query) ||
        cor.includes(query) ||
        tel.includes(query) ||
        user.includes(query)
      );
    });
  }, [items, q]);

  const totalActivos = filtered.filter((d) => isActive(d.estado)).length;
  const totalInactivos = filtered.length - totalActivos;

  const openCreate = () => {
    setEditing(null);
    setForm({
      id_institucional_docente: "",
      cedula: "",
      nombres_docente: "",
      apellidos_docente: "",
      correo_docente: "",
      telefono_docente: "",
      nombre_usuario: "",
    });
    setOpen(true);
  };

  const openEdit = (d: Docente) => {
    setEditing(d);
    setForm({
      id_institucional_docente: d.id_institucional_docente ?? "",
      cedula: d.cedula ?? "",
      nombres_docente: d.nombres_docente ?? "",
      apellidos_docente: d.apellidos_docente ?? "",
      correo_docente: d.correo_docente ?? "",
      telefono_docente: d.telefono_docente ?? "",
      nombre_usuario: d.nombre_usuario ?? "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const validate = (): string | null => {
    if (!form.id_institucional_docente.trim()) return "Ingresa el ID institucional.";
    if (!form.cedula.trim()) return "Ingresa la cédula.";
    if (!form.nombres_docente.trim()) return "Ingresa los nombres.";
    if (!form.apellidos_docente.trim()) return "Ingresa los apellidos.";
    // nombre_usuario puede ser opcional si tú lo generas en backend, si lo quieres obligatorio descomenta:
    // if (!form.nombre_usuario.trim()) return "Ingresa el nombre de usuario.";
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    setLoading(true);
    try {
      if (editing) {
        const payload: DocenteUpdateDTO = {
          id_institucional_docente: form.id_institucional_docente.trim(),
          cedula: form.cedula.trim(),
          nombres_docente: form.nombres_docente.trim(),
          apellidos_docente: form.apellidos_docente.trim(),
          ...(form.correo_docente.trim() ? { correo_docente: form.correo_docente.trim() } : {}),
          ...(form.telefono_docente.trim() ? { telefono_docente: form.telefono_docente.trim() } : {}),
          ...(form.nombre_usuario.trim() ? { nombre_usuario: form.nombre_usuario.trim() } : {}),
        };

        await docentesService.update(editing.id_docente, payload);
      } else {
        // ✅ AQUÍ VA EL PAYLOAD
        const payload: DocenteCreateDTO = {
          id_institucional_docente: form.id_institucional_docente.trim(),
          cedula: form.cedula.trim(),
          nombres_docente: form.nombres_docente.trim(),
          apellidos_docente: form.apellidos_docente.trim(),
          ...(form.correo_docente.trim() ? { correo_docente: form.correo_docente.trim() } : {}),
          ...(form.telefono_docente.trim() ? { telefono_docente: form.telefono_docente.trim() } : {}),
          ...(form.nombre_usuario.trim() ? { nombre_usuario: form.nombre_usuario.trim() } : {}),
          debe_cambiar_password: 1,
        };

        await docentesService.create(payload);
      }

      await load();
      closeModal();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "No se pudo guardar el docente.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (d: Docente) => {
    const nombre = `${d.nombres_docente ?? ""} ${d.apellidos_docente ?? ""}`.trim();
    const action = isActive(d.estado) ? "desactivar" : "activar";
    if (!confirm(`¿Seguro que deseas ${action} a "${nombre}"?`)) return;

    const currentEstado: Estado01 = to01(d.estado);

    setLoading(true);
    try {
      await docentesService.toggleEstado(d.id_docente, currentEstado);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Error al cambiar estado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="docentes-wrap">
      <div className="docentes-header">
        <div className="docentes-title">
          <h1>Docentes</h1>
          <p>Registro de docentes y control de estado.</p>
        </div>

        <div className="docentes-actions">
          <input
            className="input-base docentes-search"
            placeholder="Buscar por ID, cédula, nombres, apellidos, usuario…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-primary" onClick={openCreate}>
            + Nuevo
          </button>
        </div>
      </div>

      <div className="docentes-card">
        <div className="docentes-card-head">
          <div className="docentes-meta">
            <span className="meta-chip">Total: <b>{filtered.length}</b></span>
            <span className="meta-chip">Activos: <b>{totalActivos}</b></span>
            <span className="meta-chip">Inactivos: <b>{totalInactivos}</b></span>
          </div>
          <span className="docentes-hint">Tip: desactiva en vez de eliminar.</span>
        </div>

        <div className="docentes-table-scroll">
          <table className="docentes-table">
            <thead>
              <tr>
                <th>ID inst.</th>
                <th>Cédula</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th className="docentes-actions-col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="td-center">Cargando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="td-center">Sin datos</td></tr>
              ) : (
                filtered.map((d) => {
                  const activo = isActive(d.estado);
                  return (
                    <tr key={d.id_docente}>
                      <td className="td-strong">{d.id_institucional_docente}</td>
                      <td className="td-muted">{d.cedula}</td>
                      <td className="td-muted">{d.nombres_docente}</td>
                      <td className="td-muted">{d.apellidos_docente}</td>
                      <td className="td-muted">{d.correo_docente ?? "—"}</td>
                      <td className="td-muted">{d.telefono_docente ?? "—"}</td>
                      <td className="td-muted">{d.nombre_usuario ?? "—"}</td>
                      <td>
                        <span className={`badge ${activo ? "active" : "inactive"}`}>
                          {activo ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="table-btn" onClick={() => openEdit(d)}>Editar</button>
                          <button
                            className={`table-btn ${activo ? "danger" : "success"}`}
                            onClick={() => toggleEstado(d)}
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
                <h2 className="modal-title">{editing ? "Editar docente" : "Nuevo docente"}</h2>
                <p className="modal-subtitle">Completa los datos obligatorios.</p>
              </div>
              <button className="icon-btn" type="button" onClick={closeModal} aria-label="Cerrar">✕</button>
            </div>

            <form className="modal-body" onSubmit={onSubmit}>
              <div className="form-grid">
                <div>
                  <label className="form-label">ID institucional</label>
                  <input className="input-base" value={form.id_institucional_docente}
                    onChange={(e) => setForm((p) => ({ ...p, id_institucional_docente: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Cédula</label>
                  <input className="input-base" value={form.cedula}
                    onChange={(e) => setForm((p) => ({ ...p, cedula: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Nombres</label>
                  <input className="input-base" value={form.nombres_docente}
                    onChange={(e) => setForm((p) => ({ ...p, nombres_docente: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Apellidos</label>
                  <input className="input-base" value={form.apellidos_docente}
                    onChange={(e) => setForm((p) => ({ ...p, apellidos_docente: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Correo (opcional)</label>
                  <input className="input-base" value={form.correo_docente}
                    onChange={(e) => setForm((p) => ({ ...p, correo_docente: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Teléfono (opcional)</label>
                  <input className="input-base" value={form.telefono_docente}
                    onChange={(e) => setForm((p) => ({ ...p, telefono_docente: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Usuario (opcional)</label>
                  <input className="input-base" value={form.nombre_usuario}
                    onChange={(e) => setForm((p) => ({ ...p, nombre_usuario: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancelar</button>
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
