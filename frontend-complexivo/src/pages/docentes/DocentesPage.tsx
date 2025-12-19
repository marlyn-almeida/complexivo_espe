import { useEffect, useMemo, useState } from "react";
import { docentesService, type DocenteCreateDTO, type DocenteUpdateDTO } from "../../services/docentes.service";
import type { Docente } from "../../types/docente";
import "./DocentesPage.css";

const emptyForm: DocenteCreateDTO = {
  id_institucional_docente: "",
  cedula: "",
  nombres_docente: "",
  apellidos_docente: "",
  correo_docente: "",
  telefono_docente: "",
  nombre_usuario: "",
  debe_cambiar_password: 1,
};

export default function DocentesPage() {
  const [items, setItems] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Docente | null>(null);
  const [form, setForm] = useState<DocenteCreateDTO>(emptyForm);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((d) => {
      const full = `${d.nombres_docente} ${d.apellidos_docente}`.toLowerCase();
      return (
        full.includes(t) ||
        d.cedula?.toLowerCase().includes(t) ||
        d.id_institucional_docente?.toLowerCase().includes(t) ||
        d.correo_docente?.toLowerCase().includes(t) ||
        d.nombre_usuario?.toLowerCase().includes(t)
      );
    });
  }, [items, q]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await docentesService.list();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (d: Docente) => {
    setEditing(d);
    setForm({
      id_institucional_docente: d.id_institucional_docente,
      cedula: d.cedula,
      nombres_docente: d.nombres_docente,
      apellidos_docente: d.apellidos_docente,
      correo_docente: d.correo_docente,
      telefono_docente: d.telefono_docente,
      nombre_usuario: d.nombre_usuario,
      debe_cambiar_password: d.debe_cambiar_password,
    });
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const onChange = (k: keyof DocenteCreateDTO, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.id_institucional_docente || !form.cedula || !form.nombres_docente || !form.apellidos_docente) {
      alert("Completa: ID institucional, cédula, nombres y apellidos.");
      return;
    }

    if (!editing) {
      await docentesService.create(form);
    } else {
      const payload: DocenteUpdateDTO = { ...form };
      await docentesService.update(editing.id_docente, payload);
    }

    setOpen(false);
    await load();
  };

  const toggleEstado = async (d: Docente) => {
    await docentesService.toggleEstado(d.id_docente, d.estado);
    await load();
  };

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h2 className="page-title">Docentes</h2>
          <p className="page-subtitle">Gestión y habilitación de docentes del sistema.</p>
        </div>

        <div className="page-actions">
          <input
            className="input-base search-input"
            placeholder="Buscar por nombre, cédula, correo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-primary" onClick={openCreate}>
            + Nuevo docente
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>ID Institucional</th>
                <th>Cédula</th>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Estado</th>
                <th style={{ width: 200 }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={7}>Cargando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>Sin datos</td></tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id_docente}>
                    <td>
                      <div className="docentes-name">{d.nombres_docente} {d.apellidos_docente}</div>
                      <div className="docentes-sub">{d.telefono_docente}</div>
                    </td>
                    <td>{d.id_institucional_docente}</td>
                    <td>{d.cedula}</td>
                    <td>{d.nombre_usuario}</td>
                    <td>{d.correo_docente}</td>
                    <td>
                      <span className={`badge ${d.estado === 1 ? "active" : "inactive"}`}>
                        {d.estado === 1 ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="table-btn" onClick={() => openEdit(d)}>Editar</button>
                        <button
                          className={`table-btn ${d.estado === 1 ? "danger" : "success"}`}
                          onClick={() => toggleEstado(d)}
                        >
                          {d.estado === 1 ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editing ? "Editar docente" : "Nuevo docente"}</h3>
            <p className="modal-subtitle">Completa los datos del docente.</p>

            <div className="modal-form">
              <div className="modal-grid">
                <div>
                  <label className="form-label">ID institucional</label>
                  <input className="input-base" value={form.id_institucional_docente}
                    onChange={(e) => onChange("id_institucional_docente", e.target.value)} />
                </div>

                <div>
                  <label className="form-label">Cédula</label>
                  <input className="input-base" value={form.cedula}
                    onChange={(e) => onChange("cedula", e.target.value)} />
                </div>

                <div>
                  <label className="form-label">Nombres</label>
                  <input className="input-base" value={form.nombres_docente}
                    onChange={(e) => onChange("nombres_docente", e.target.value)} />
                </div>

                <div>
                  <label className="form-label">Apellidos</label>
                  <input className="input-base" value={form.apellidos_docente}
                    onChange={(e) => onChange("apellidos_docente", e.target.value)} />
                </div>

                <div>
                  <label className="form-label">Correo</label>
                  <input className="input-base" value={form.correo_docente}
                    onChange={(e) => onChange("correo_docente", e.target.value)} />
                </div>

                <div>
                  <label className="form-label">Teléfono</label>
                  <input className="input-base" value={form.telefono_docente}
                    onChange={(e) => onChange("telefono_docente", e.target.value)} />
                </div>

                <div>
                  <label className="form-label">Usuario</label>
                  <input className="input-base" value={form.nombre_usuario}
                    onChange={(e) => onChange("nombre_usuario", e.target.value)} />
                </div>

                <div>
                  <label className="form-label">Debe cambiar contraseña</label>
                  <select
                    className="input-base"
                    value={form.debe_cambiar_password ?? 1}
                    onChange={(e) => onChange("debe_cambiar_password", Number(e.target.value) as 0 | 1)}
                  >
                    <option value={1}>Sí</option>
                    <option value={0}>No</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
                <button className="btn-primary" onClick={submit}>
                  {editing ? "Guardar cambios" : "Crear docente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
